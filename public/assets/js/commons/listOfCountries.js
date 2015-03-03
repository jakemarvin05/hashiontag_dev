function CountryList() {
    this.withRegion = function() {
        return this.list;
    },
    this.withoutRegion = function() {
        var regions = Object.keys(this.list);
        var list = [];
        for(var i = 0 ; i < regions.length; i++) {
            if (i === 0 ) { list = this.list[regions[i]].slice(); continue; }
            list = list.concat(this.list[regions[i]]);
        }
        return list.sort();
    }
    this.list = {

        usc: [ 
            "Canada",
            "Saint Pierre and Miquelon",
            "United States",
            "United States Minor Outlying Islands"
        ],
        sea: [
            "Brunei Darussalam",
            "Cambodia",
            "Guam",
            "Indonesia",
            "Lao People's Democratic Republic",
            "Malaysia",
            "Myanmar",
            "Northern Mariana Islands",
            "Palau",
            "Philippines",
            "Singapore",
            "Thailand",
            "Timor-leste",
            "Vietnam"
        ],
        asianeu: [
            "Albania",
            "Andorra",
            "Austria",
            "Azerbaijan",
            "Bangladesh",
            "Belarus",
            "Belgium",
            "Bhutan",
            "Bosnia and Herzegovina",
            "Bulgaria",
            "China",
            "Croatia",
            "Czech Republic",
            "Denmark",
            "Estonia",
            "Faroe Islands",
            "Finland",
            "France",
            "Georgia",
            "Germany",
            "Gibraltar",
            "Greece",
            "Greenland",
            "Holy See (Vatican City State)",
            "Hong Kong",
            "Hungary",
            "Iceland",
            "India",
            "Ireland",
            "Italy",
            "Japan",
            "Kazakhstan",
            "Korea Democratic People's Republic of",
            "Korea Republic of",
            "Kyrgyzstan",
            "Latvia",
            "Liechtenstein",
            "Lithuania",
            "Luxembourg",
            "Macao",
            "Macedonia The Former Yugoslav Republic of",
            "Maldives",
            "Malta",
            "Moldova Republic of",
            "Monaco",
            "Mongolia",
            "Montserrat",
            "Nepal",
            "Netherlands",
            "Norway",
            "Pakistan",
            "Poland",
            "Portugal",
            "Romania",
            "Russian Federation",
            "San Marino",
            "Serbia and Montenegro",
            "Slovakia",
            "Slovenia",
            "Spain",
            "Sri Lanka",
            "Svalbard and Jan Mayen",
            "Sweden",
            "Switzerland",
            "Taiwan Province of China",
            "Tajikistan",
            "Turkmenistan",
            "Ukraine",
            "United Kingdom",
            "Uzbekistan"
        ],
        oceania: [
            "American Samoa",
            "Australia",
            "Christmas Island",
            "Cocos (Keeling) Islands",
            "Fiji",
            "French Polynesia",
            "New Caledonia",
            "New Zealand",
            "Niue",
            "Norfolk Island",
            "Papua New Guinea",
            "Solomon Islands",
            "Tonga",
            "Tuvalu",
            "Vanuatu",
            "Wallis and Futuna"
        ],
        me: [
            "Afghanistan",
            "Armenia",
            "Bahrain",
            "Cyprus",
            "Iran Islamic Republic of",
            "Iraq",
            "Israel",
            "Jordan",
            "Kuwait",
            "Lebanon",
            "Libyan Arab Jamahiriya",
            "Oman",
            "Palestinian Territory Occupied",
            "Qatar",
            "Saudi Arabia",
            "Syrian Arab Republic",
            "Turkey",
            "United Arab Emirates",
            "Yemen"
        ],
        row: [
            "Algeria",
            "Angola",
            "Anguilla",
            "Antarctica",
            "Antigua and Barbuda",
            "Argentina",
            "Aruba",
            "Bahamas",
            "Barbados",
            "Belize",
            "Benin",
            "Bermuda",
            "Bolivia",
            "Botswana",
            "Bouvet Island",
            "Brazil",
            "British Indian Ocean Territory",
            "Burkina Faso",
            "Burundi",
            "Cameroon",
            "Cape Verde",
            "Cayman Islands",
            "Central African Republic",
            "Chad",
            "Chile",
            "Colombia",
            "Comoros",
            "Congo",
            "Congo The Democratic Republic of The",
            "Cook Islands",
            "Costa Rica",
            "Cote D'ivoire",
            "Cuba",
            "Djibouti",
            "Dominica",
            "Dominican Republic",
            "Ecuador",
            "Egypt",
            "El Salvador",
            "Equatorial Guinea",
            "Eritrea",
            "Ethiopia",
            "Falkland Islands (Malvinas)",
            "French Guiana",
            "French Southern Territories",
            "Gabon",
            "Gambia",
            "Ghana",
            "Grenada",
            "Guadeloupe",
            "Guatemala",
            "Guinea",
            "Guinea-bissau",
            "Guyana",
            "Haiti",
            "Heard Island and Mcdonald Islands",
            "Honduras",
            "Jamaica",
            "Kenya",
            "Kiribati",
            "Lesotho",
            "Liberia",
            "Madagascar",
            "Malawi",
            "Mali",
            "Marshall Islands",
            "Martinique",
            "Mauritania",
            "Mauritius",
            "Mayotte",
            "Mexico",
            "Micronesia Federated States of",
            "Morocco",
            "Mozambique",
            "Namibia",
            "Nauru",
            "Netherlands Antilles",
            "Nicaragua",
            "Niger",
            "Nigeria",
            "Panama",
            "Paraguay",
            "Peru",
            "Pitcairn",
            "Puerto Rico",
            "Reunion",
            "Rwanda",
            "Saint Helena",
            "Saint Kitts and Nevis",
            "Saint Lucia",
            "Saint Vincent and The Grenadines",
            "Samoa",
            "Sao Tome and Principe",
            "Senegal",
            "Seychelles",
            "Sierra Leone",
            "Somalia",
            "South Africa",
            "South Georgia and The South Sandwich Islands",
            "Sudan",
            "Suriname",
            "Swaziland",
            "Tanzania United Republic of",
            "Togo",
            "Tokelau",
            "Trinidad and Tobago",
            "Tunisia",
            "Turks and Caicos Islands",
            "Uganda",
            "Uruguay",
            "Venezuela",
            "Virgin Islands British",
            "Virgin Islands U.S.",
            "Western Sahara",
            "Zambia",
            "Zimbabwe"
        ]
  
    }
}
if (module) module.exports = CountryList;

function selectCountry(selectId, selection) {
    var i = 0,
        elem_select = document.getElementById(selectId),
        flag = false;
        x = document.createElement('option');

    x.value = "";
    x.innerHTML = "-- select a country --";
    elem_select.appendChild(x);

    var list = (new CountryList()).withoutRegion();
    while(list[i]) {
        var o = document.createElement('option'),
        c = list[i];
        o.value = c;
        o.innerHTML = c;
        elem_select.appendChild(o);
        if(selection && selection === c) { o.selected = true; flag = true; }
        i++;
    }
    if(!flag) { x.selected = true; }
}