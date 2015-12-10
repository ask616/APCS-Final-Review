$(document).ready(function(){

    // Connect to DB
    Parse.initialize("gV7nKoiPMnEPz2WAvVNdlLnIE3rdMGCVTywuGxhg", "9pxUUwLlmOdB9C54yxvYH38c7YVtNvWYyMbNoPjS");

    var LessonsListClass = Parse.Object.extend("LessonsList");
    var LessonClass = Parse.Object.extend("Lesson");

    var lessonsListQuery = new Parse.Query(LessonsListClass);
    var lessonQuery = new Parse.Query(LessonClass);


    // Gets parameter from URL if exists
    function checkUrlParam(){
        var param = /i=([^&]+)/.exec(window.location.href);
        var result = param ? param[1] : 0;
        result = parseInt(result);
        return result;
    }

    // Builds a list of the names of all the lessons
    function getLessonNames(lessonList){
        lessonNames = [];
        for(var i = 0; i < lessonList.length; i++){
            lessonNames.push(lessonList[i].lessonName)
        }
        return lessonNames;
    }

    // Builds the nav bar at the top right to access all lesson content
    function buildLessonNavBar(lessonNames, index){
        // Puts name of current lesson
        var preText = ' <i class="fa fa-chevron-down"></i>'
        $('.section-title').html('Lesson ' + lessonNames[index] + preText);

        // Builds menu with all lessons
        for(var i = 0; i < lessonNames.length; i++){
            var sectionEntry = '<li class="mdl-menu__item lesson-link" id="link-' + i + '">Lesson ' + lessonNames[i] + '</li>';
            $('.section-menu').append(sectionEntry);
        }

        // Add click listener to any value in the list and redirect appropriately
        $(".lesson-link").click(function(e){
            var id = e.target.id.replace("link-", "");
            $(location).attr('href','/?i='+id);
        });
    }

    // Builds a list of the ObjectIDs of all the lessons
    function getLessonIds(lessonList){
        lessonIds = [];
        for(var i = 0; i < lessonList.length; i++){
            lessonIds.push(lessonList[i].lessonId)
        }
        return lessonIds;
    }

    // Simple hash function
    function hash(str){
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash;
        }
        return hash;
    }

    // Set a cookie to storage
    function setCookie(cname, cvalue) {
        var d = new Date();
        d.setTime(d.getTime() + (24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    // Retrieve cookie value by name
    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    }

    // Builds a card using problem data and appends to page
    function buildProblem(problemText, solutionText, problemNum){
        // Problem card template
        var problemPreProcessed = '<div class="problem-card mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop"> <div class="card-head mdl-card__title mdl-card--expand mdl-color--teal-300"> <h2 class="mdl-card__title-text mdl-color-text--grey-50">Problem $(problemNumPlusOne)</h2> </div> <div class="mdl-card__supporting-text mdl-color-text--grey-600"> <div class="problem-text problem-$(problemNum)-text"> $(problemText) <div class="problem-$(problemNum)-solution solution-text"> <pre>$(solutionText)</pre> </div> </div> </div> <div class="mdl-card__actions mdl-card--border"> <div id="problem-$(problemNum)-button-wrapper"> </div> </div> </div>';
        // Build card wrapper
        var newProblem = document.createElement('div');
        newProblem.className = 'mdl-grid';

        // Add question and solution text
        var processed = problemPreProcessed.split("$(problemNumPlusOne)").join(problemNum+1).split("$(problemNum)").join(problemNum);
        processed = processed.split("$(problemText)").join(problemText).split("$(solutionText)").join(solutionText);
        newProblem.innerHTML = processed;

        // Add answer button
        var showAnswerButton = document.createElement('a');
        showAnswerButton.id = "show-answer-" + problemNum;
        showAnswerButton.className = 'show-answer-btn mdl-button mdl-js-button mdl-js-ripple-effect';
        showAnswerButton.innerHTML = 'Show Answer';

        // Convert to MDL element
        componentHandler.upgradeElement(showAnswerButton);

        // Add to page
        document.getElementById('problems').appendChild(newProblem);
        document.getElementById('problem-' + problemNum + '-button-wrapper').appendChild(showAnswerButton);
    }

    // Sets a click listener for the 'Show Answer' button on problem cards
    function answerButtonsListener(){
        $(".show-answer-btn").click(function(e){
            var problemNum = e.target.parentNode.id.replace("show-answer-", "");
            $(".problem-" + problemNum + "-solution").slideToggle();
        });
    }

    // Adds problems from current set to page
    function loadProblems(sets, setNum){
        var set = sets[setNum];

        $('.set-author').html(set.name);
        // Store cookie data in case of problem editing
        setCookie("code", hash(set.code));
        setCookie("setIndex", setNum);

        $('.set-num').html(setNum+1);

        var problems = set.problems;

        // Build cards for each problem and add to page
        for(var i = 0; i < problems.length; i++){
            buildProblem(problems[i].question, problems[i].solution, i);
        }

        // Add click listeners fo the 'Show Answer' button on each card
        answerButtonsListener();
    }

    function setLinkListeners(sets){
        $(".set-link").click(function(e){
            var clickedSet = parseInt(e.target.id.replace("set-",""));
            $("#set-num").html(clickedSet+1);
            $("#problems").html("");
            loadProblems(sets, clickedSet);
        });
    }

    // Get list of sets for side nav
    function loadSets(lessonId){

        lessonQuery.get(lessonId, {
            success: function(lesson) {
                var sets = lesson.get("sets");
                if(sets.length == 0){
                    // No sets available for current lesson
                    $("#set-title").html("No problems here yet!");
                    $(".edit-problems-btn").hide();
                } else {
                    // Build sidebar
                    var preText = '<a class="mdl-navigation__link set-link" id="set-';
                    for(var i = 0; i < sets.length; i++){
                        $('.nav-sets').append(preText + i + '"> Set ' + (i + 1) + '</a>');
                    }
                    // Store lessonId in case of problem editing
                    setCookie("lessonId", lessonId);
                    // Load the problems in this set
                    loadProblems(sets, 0);
                    // Add click listeners for the sidebar
                    setLinkListeners(sets);
                }
            },
            error: function(obj, error) {
                alert(error.message)
            }
        });
    }

    function loadData(){
        lessonsListQuery.get("iyb8zsKB5i", {
            success: function(lessonsList) {

                // Check if access to the site is disabled
                var access = lessonsList.get("access");
                if(!access){
                    // If so, halt loading
                    $(".edit-problems-btn").remove();
                    $(".problem-submit-link").remove();
                    $("#set-title").html("Access has currently been disabled by admin");
                    return;
                }

                // Populate section nav at top right
                lessonsList = lessonsList.get("lessons")

                var lessonNames = getLessonNames(lessonsList);
                // CHeck if we're loading a particular lesson
                var index = checkUrlParam();

                // Build the top right nav dropdown
                buildLessonNavBar(lessonNames, index);

                // Get a list of all the lesson ObjectIDs
                var lessonIds = getLessonIds(lessonsList);

                // Build the left sidebar for navigation between sets
                loadSets(lessonIds[index]);

            },
            error: function(obj, error) {
                alert(error.message);
            }
        });

    }


    loadData();


    // Handle problem edit request
    $(".edit-problems-btn").click(function(){
        var codeResp = prompt("Enter your code: ");

        if(codeResp == null){
            alert("Invalid code");
            return;
        } else {
            // Check if the input is the same as the stored code
            if(hash(codeResp) == getCookie("code")){
                // Store input for validation again on edit page
                setCookie("codeResp", codeResp);
                // Reroute to edit page
                $(location).attr('href','/submit?edit=true');
            } else {
                alert("Incorrect code");
            }
        }
    });
});
