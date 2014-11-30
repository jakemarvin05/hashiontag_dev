
var db = require('../models');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var noUpdates=0;
var startTime;
var moment = require('moment');
var fname = "streamUpdate.js ";

eventEmitter.once('Done', function(res){
    console.log('Completed updating!');
    console.log('start time: '+startTime);
    console.log('end time: '+ Date.now());
    if(res) { res.send('Done updating Stream.'); }
});

module.exports = function allUserStreamUpdate(req, res) {

    var allUserInstance;
    startTime = Date.now();
    db.User.findAll({
        //attributes: ['userId', 'lastStreamUpdate']
    }).then(function(result){
        //console.log(JSON.stringify(result));
        noUpdates = Object.keys(result).length;
        var item = Object.keys(result).length;
        console.log('Number of Users: '+item);
        for (var i=0;i<item;i++){
            //console.log(JSON.stringify(result[i]));
            //for each user do something
            updateStream(result[i].userId, result[i].lastStreamUpdate);
            //console.log(Date.now());
            result[i].lastStreamUpdate = Date.now();
            //console.log(JSON.stringify(result[i]));
            result[i].save().catch(function(err){
                console.log(err);
            });
        }

    }).catch(function(err){
        if(res) { res.send('Error occured. '+Date.now()); }
        console.log(err);
    });


    // for(var index=0; index<item; index++){
    //     allUser.push(result[index].values['userId']);
    // }
    // console.log(allUser);
    //-------------------UPDATE STREAM SCORE------------------------------//
    // for(user in allUser){ //for all user, update stream score then mapStreamScoreToStream
    //     updateStreamScore(user, db);
    // }
    // for(user in allUser){
    //     mapStreamScoreToStream(user);
    // }
    //-------------------GRAB POPULAR POST NOT RELATED TO USER------------//
    //obtainPopularPost();




    function updateStream(userId, lastStreamUpdate){
        var maxStore = 5;

        if(!lastStreamUpdate) { var lastStreamUpdate = moment(0).format(); }

        //console.log('\n-----------user id: '+ userId+'--------------');

        db.Following.findAll({
            where: {
                FollowerId: userId
            },
            attributes: ['affinityId', 'affinity'],
            include: [{
                model: db.User,
                attributes: ['userId'],
                include: [{
                    model: db.Post,
                    where: {
                        createdAt: {
                            gte: lastStreamUpdate
                        }
                    },
                    attributes: ['postId', 'createdAt']//,
                    //order: [['createdAt', 'DESC']],
                }]
            }],
            order: [['affinity', 'DESC']]

        }).then(function(result){
            //console.log('------------------------------------');
            //console.log(JSON.stringify(result));
            // console.log(Date());
            //console.log('------------------------------------');

            //no results just end this update.
            if(result.length === 0) { 
                console.log(fname + 'no results found for userId: ' + userId); 
                return endStreamUpdate(userId, res);
            }

            var toBePushed = [];
            var postCount;
            var toBeReduced = [];
            var tempPosts =[];
            var reduceBy = 0;


            //console.log('last stream update: '+ result.values['lastStreamUpdate']);
            console.log('\n-----------user id: '+ userId+'--------------');
            console.log('Number of users followed by userId '+userId+' : '+ result.length);

            for(var i=0;i<result.length;i++){
                tempPosts =[];
                postCount = 0;
                reduceBy = 0;

                if(maxStore ===0){
                        console.log('MaxStored reached! Ignoring Next user. Returning...');
                        break;
                    }

                var posts = result[i].user.posts,
                    pLen = posts.length;

                if(posts.length === 0) { continue; }

                for(var p=0; p<pLen ;p++){
                    if(maxStore ===0){
                        console.log('MaxStored reached! Returning...');
                        break;
                    }

                    toBePushed.push({ 
                        Post_postId: posts[p].postId, 
                        User_userId: userId
                    });
                    tempPosts.push(posts[p].postId);
                    postCount+=1;
                    maxStore -=1;
                }

                reduceBy = Math.min(postCount, result[i].affinity);
                //console.log(toBePushed);
                console.log('affinityID: '+result[i].affinityId+' reduced by '+reduceBy);
                if(reduceBy !== 0) {
                    result[i].affinity = Math.floor(result[i].affinity);
                    result[i].affinity -= reduceBy + (Math.random()/1000);
                    result[i]._hasChanged = true;
                }


                // toBeReduced.push({
                //     affinityId: result[i].values['affinityId'],
                //     affinity: Math.min(postCount, result[i].values['affinity'])
                // });


                // FOR CHECKING ONLY
                // console.log('userId: '+ result[i].values['user'].values['userId']);
                // console.log('affinity: '+ result[i].values['affinity']);
                // console.log('number of Posts: '+ postCount);
                // console.log('postIds: '+tempPosts);
                // console.log('recducing affinity by: '+Math.min(postCount, result[i].values['affinity']));
                // console.log('remaining Posts: '+maxStore);
            }

            console.log('---------DB STORE-----------');
            // console.log('Summary affinity reduction: ');
            // console.log(toBeReduced);
            //console.log('Items to push to stream table : '+ toBePushed.length+' items.');
           // console.log(toBePushed);
            console.log('Storing into stream table...');
            //flip the order of toBePushed
            toBePushed.reverse();
            storeStream(toBePushed, userId, res);
            console.log('Updating affinity score...');

            //for all the user daos, loop through.
            for(var i=0;i<result.length;i++){
                
                //if there are changes, call save();
                if(result[i]._hasChanged) {
                    result[i].save().catch(function(err){
                        console.log(err);
                    });
                }
                
            }
            //decrementAffinity(toBeReduced);
            console.log('---------/DB STORE-----------');
            //console.log(JSON.stringify(result));
            
        })
        
    }

    //This method stores the popular post into the Stream Table.
    function storeStream(storeObject, userId, res){

        // var bulk = [];
        // for(var i=0;i<postIdArray.length;i++){

        // }
        console.log(storeObject);
        db.Stream.bulkCreate(
            storeObject
        ).then(function(){
            endStreamUpdate(userId, res);
        }).catch (function(err){
            endStreamUpdate(userId, res);
            console.log('Stream Store ERROR for userId: '+ userId);
            console.log(err);
        });
    }

    function endStreamUpdate(userId, res) {
        noUpdates -=1; 
        console.log(fname + 'stream updates ended for userId: ' + userId);
        console.log('updates remaining: ' + noUpdates);
        if(noUpdates===0){ eventEmitter.emit('Done', res); }
    }

    function decrementAffinity(affinityObject){
        var affinityId =[]
        for(var i=0;i<affinityObject.length;i++){
            console.log('AffinityID: '+affinityObject[i].affinityId);
            console.log('reduced by: '+affinityObject[i].affinity);
            if(affinityObject[i].affinity===0){
                console.log('Not reducing affinity as it is 0 reduction. Continue...');
                continue;
            }

        }
    }

    /*
    1. db.find all post of user followed> lastStreamUpdate
    2. user.getFollow, set user last stream Update = time.now()
    3. 
    you query posts createdAt > updated

    then sort by affinity score take top... X

    push to Stream table, decrement affinity
    the score is affinity score
    */

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
    
}