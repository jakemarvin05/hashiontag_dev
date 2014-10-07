
var db = require('../models');

module.exports = function allUserStreamUpdate() {

    var allUser = [];

    db.User.findAll({
        attributes: ['userId']
    }).then(function(result){
        
        var item = Object.keys(result).length;
        console.log('Number of Users: '+item);

        for(var index=0; index<item; index++){
            allUser.push(result[index].values['userId']);
        }
        console.log(allUser);
        //-------------------UPDATE STREAM SCORE------------------------------//
        for(user in allUser){ //for all user, update stream score then mapStreamScoreToStream
            updateStreamScore(user, db);
        }
        for(user in allUser){
            mapStreamScoreToStream(user);
        }
    });
    

    //-------------------GRAB POPULAR POST NOT RELATED TO USER------------//
    obtainPopularPost();
}


//------------The method listed below assumes that variable db is global-------------


//This method will update a specific user StreamScore table
function updateStreamScore(userId){

    var minAffinity = 0, //arbitary value
        minUser = 1;
    console.log('Minimum Affinity: '+minAffinity);
    console.log('Maximum User number: '+minUser);

    //get dbInstanceFollowing 
    db.Following.findAll({
        where: {
            FollowerId: userId,
            affinity: {
                gte: minAffinity
            }
        },
        attributes:['id', 'FollowId', 'affinity', 'createdAt'],
        order: 'affinity DESC',
        limit: minUser

    }).then(function(result){

        //console.log(Object.keys(result).length);
        var items = Object.keys(result).length;
        console.log('Got the number of users: '+items+'\n');
        //console.log(dbInstanceFollowing);

       /* for each following ID
        then you store the affinity score and recency bonus as temp.
        then you do another loop for each postID owned by followingId
            the do calculation*/

        for(var index = 0; index< items; index++){
            //tempId refers to the primary key of Following table
            var tempId = result[index].values['id'];

            //Affinity score
            var tempAffinity = result[index].values['affinity'];
            var tempFollowId = result[index].values['FollowId'];

            //Date score ---NEEDS TO BE CALCULATED IN THE FORM OF INTEGER.
            //tempCreatedAt = dbInstanceFollowing.rows[index].values['createdAt'];
            var tempCreatedAt = 1;

            console.log('FollowId: '+tempFollowId +' affinity: '+tempAffinity+' Created at: '+tempCreatedAt+'\n' )
            calculateAndStoreStreamScore(tempId, tempAffinity, tempFollowId, tempCreatedAt);
            
        }
    });
}


/*this method will calculate Stream Score based on parameters and store it into StreamScore Table.
 
 *IMPORTANT PARAMETERS THAT LIMIT THE DB SEARCH RESULT
  MinPostScore = 1
  maxPost = 3
*/
function calculateAndStoreStreamScore(followingId, affinity, followId, createdAt){
    //Obtaining All post score of the people he follow.
    var minPostScore = 1,   //arbitary value
        maxPost = 3;        //arbitary value

        console.log('Minimum Post Score: '+minPostScore);
        console.log('Maximum Post number: '+maxPost);

    var tempScore;

    db.Post.findAll({
        where: {
            User_userId: followId,
            postScore: {
                gte: minPostScore
            }
        },
        attributes: ['postId','postScore'],
        order: [['postScore', 'DESC']],
        limit: maxPost

    }).then(function(result){
        var items = Object.keys(result).length;
        console.log ('FollowId: '+followId+' Total post: '+items+'\n');
        console.log ('Calculating StreamScore for FollowId: '+followId+'\n');
        for(var i = 0; i<items;i++){
            tempScore = calculateScore(result[i].values['postScore'], affinity, createdAt);
            console.log('StreamScore of Postid:'+result[i].values['postId']+' FollowId: '+followId+' is '+tempScore);
            //store each tempScore in the StreamScore table.
            storeScore(followingId, result[i].values['postId'], tempScore);
        }
    });
}

/*this method will calculate Stream Score based on their weightage in calculations.

*IMPORTANT PARAMETERS THAT DEFINE THE CURRENT WEIGHTS
    postScoreWeightage = 40,
    affinityScoreWeigtage = 20,
    recencyBonusWeigtage = 40;
*/
function calculateScore(postScore, affinityScore, recencyBonus){
    var postScoreWeightage = 40,
        affinityScoreWeigtage = 20,
        recencyBonusWeigtage = 40;

    //var totalWeight = postScoreWeightage + affinityScoreWeigtage +recencyBonusWeigtage;

    var finalScore = (postScoreWeightage*postScore + affinityScoreWeigtage*affinityScore + recencyBonus*recencyBonusWeigtage);///totalWeight

    //finalScore is no normalized by total weight
    return finalScore;
}

//this method will store a specific StreamScore into their Stream Score table.
function storeScore(followingId, postId, streamScore){

    db.StreamScore.find({
        where: {
            postId: postId,
            followingId: followingId
        },
        attributes : ['postId','followingId','streamScore']
    }).then(function (result){
        //console.log(result);
        if(result){//data exist then update
            result.streamScore = streamScore;

            result.save().then(function(){
                console.log('StreamScore Exist!\nUpdating postId: '+postId+' followingId: '+followingId+' with new streamScore: '+streamScore+'\n');
            });
        } else{//data does not exist then create
            db.StreamScore.create({
                postId: postId,
                followingId: followingId,
                streamScore: streamScore
            }).then(function(){
                console.log('StreamScore Does not Exist\nCreating new postId: '+postId+' followingId: '+followingId+' streamScore: '+streamScore+'\n');
            });
        }
    });
}

/*this method will obtain all the popular post that meets the postScore criteria.
 
 *IMPORTANT PARAMETERS THAT LIMIT THE DB SEARCH RESULT
  MinPostScore = 1
  maxPost = 30
*/
function obtainPopularPost(){
    //get all popular post

    var minPostScore = 0, //assume 10 is a popular post.
        maxPost = 30; //arbitary value

        console.log('Minimum Post Score: '+minPostScore);
        console.log('Maximum Post number: '+maxPost);

    db.Post.findAll({
        where: {
            postScore: {
                gte: minPostScore
            }
        },
        attributes: ['postId','User_userId'],
        order: [['postScore', 'DESC']],
        limit: maxPost

    }).then(function(result){
        var items = Object.keys(result).length;
        console.log('Obtained '+items+' popular posts...');
        console.log('Pushing posts to followers...\n');

        for(var i = 0; i<items;i++){
            console.log('Pushing postId: '+result[i].values['postId']+' to all userId: '+result[i].values['User_userId']+' followers...\n');
            pushPostToAllFollowers(result[i].values['postId'], result[i].values['User_userId']);
        }
    });
}

//this methid will push popular post to all of its followers in the Stream table.
function pushPostToAllFollowers(postId, userId){

    db.Following.findAndCountAll({
        where: {
            FollowId: userId
        },
        attributes: ['FollowerId']
    }).then(function (result){
        console.log('UserId: '+userId+' Total number of followers:'+result.count+'\n');

        for(var follower = 0; follower<result.count;follower++){
            console.log('Store for postId: '+postId+' userId: '+result.rows[follower].values['FollowerId']);
            storeStream(postId, result.rows[follower].values['FollowerId']);
        }
    });
}

//This method stores the popular post into the Stream Table.
function storeStream(postId, userId){
    var streamKey = postId.toString() +'.'+ userId.toString();
    streamKey = parseFloat(streamKey);
    console.log(streamKey);

    db.Stream.find({
        where: {
            streamKey: streamKey
        },
    }).then(function (result){

        if(result){//data exist then do nothing.
           console.log('Stream Exist!\nNot doing anything...\n ');
            
        } else{//data does not exist then create
            db.Stream.create({ Post_postId: postId, User_userId: userId, streamKey: streamKey }).then(function(Stream) {
              console.log('Pushed postId: '+postId+' to userId: '+userId+'\n');
            });
        }
    });
}

/*this method will update a user Stream Table with top n number of posts from the StreamScore table.
 *IMPORTANT PARAMETERS THAT LIMIT THE DB SEARCH RESULT
  var maxPostMapped = 30;
*/
function mapStreamScoreToStream(userId){
    //get all the following ID, get all the 
    var maxPostMapped = 30;
    var followingId=[];

    db.Following.findAll({
        where: {
            FollowerId: userId
        }, 
        attributes: ['id']
    }).then(function(result){
        //console.log('-------------------------------------------');
        //for each FollowingID get the post score in and limit to 10 then store it inside the stream
        for(var item in result){
            //console.log('Following ID:'+result[item].values['id']);
            followingId.push(result[item].values['id']);
        }

        db.StreamScore.findAll({
            where: {
                followingId:followingId
            },
            attributes: ['postId', 'streamScore'],
            order: [['streamScore', 'DESC']],
            limit: maxPostMapped
        }).then(function(result){
            for(var item in result){
                console.log('postId: '+result[item].values['postId']+' StreamScore: '+result[item].values['streamScore']);
                storeStream(result[item].values['postId'],userId);
            }
        })
    });
}