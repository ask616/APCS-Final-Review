$(document).ready(function(){

    // Connect to DB
    Parse.initialize("gV7nKoiPMnEPz2WAvVNdlLnIE3rdMGCVTywuGxhg", "9pxUUwLlmOdB9C54yxvYH38c7YVtNvWYyMbNoPjS");

    var LessonsListClass = Parse.Object.extend("LessonsList");
    var LessonClass = Parse.Object.extend("Lesson");

    var lessonsListQuery = new Parse.Query(LessonsListClass);
    var lessonQuery = new Parse.Query(LessonClass);

    var problemNum = 1;


    // Looks at the URL for parameters to see if we're in edit mode
    function checkEditing(){
        var params = /edit=([^&]+)/.exec(window.location.href);
        var result = params ? params[1] : "false";
        return (result === "true");
    }

    // Gets cookie value by name
    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i < ca.length; i++) {
            var c = ca[i];

            while (c.charAt(0)==' ')
                c = c.substring(1);
            if (c.indexOf(name) == 0)
                return c.substring(name.length,c.length);
        }
        return "";
    }

    // Checks if cookie exists by name
    function checkCookie(cname) {
        var cookieVal = getCookie(cname);
        return !(cookieVal === "");
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

    // Changes UI components for edit mode
    function editModeUI(){
        $(".basic-info-card").remove();
        $(".submit-problems-btn").addClass("submit-edit-btn");
        $(".submit-problems-btn").unbind();
        $(".submit-problems-btn").removeClass("submit-problems-btn");
    }

    // Creates fields for new question
    function newProblemField(problemNum){
        // Template for problem wrapper
        var problemPreProcessed = '<div class="mdl-layout-spacer"></div><div class="mdl-card mdl-shadow--2dp mdl-cell mdl-cell--9-col-desktop mdl-cell--6-col-tablet mdl-cell--4-col-phone"> <div class="mdl-card__supporting-text"> <h4 class="mdl-color-text--blue-grey-700">Problem $(problemNumPlusOne)</h4> </div><div class="mdl-grid"> <div class="mdl-cell mdl-cell--12-col-desktop" id="problem-$(problemNum)-content"></div><div class="mdl-cell mdl-cell--12-col-desktop" id="solution-$(problemNum)-content"></div></div></div><div class="mdl-layout-spacer">';

        // Create wrapper for the question and solution inputs
        var newProblem = document.createElement('div');
        newProblem.className = 'mdl-grid';
        var processed = problemPreProcessed.split("$(problemNumPlusOne)").join(problemNum+1).split("$(problemNum)").join(problemNum);
        newProblem.innerHTML = processed;

        // Build question input
        var questionField = document.createElement('div');
        var questionClasses = 'problem-field problem-$(problemNum)-field mdl-textfield mdl-js-textfield mdl-textfield--floating-label'.split("$(problemNum)").join(problemNum);
        questionField.className = questionClasses;
        var questionContent = '<textarea class="mdl-textfield__input" type="text" rows="6" id="problem-$(problemNum)-input"></textarea><label class="mdl-textfield__label">Write your problem here:</label>'.split("$(problemNum)").join(problemNum);

        // Build solution input
        var solutionField = document.createElement('div');
        var solutionClasses = 'solution-field solution-$(problemNum)-field mdl-textfield mdl-js-textfield mdl-textfield--floating-label'.split("$(problemNum)").join(problemNum);
        solutionField.className = solutionClasses;
        var solutionContent = '<textarea class="mdl-textfield__input" type="text" rows="6" id="solution-$(problemNum)-input"></textarea><label class="mdl-textfield__label">Enter your solution here (Enter tabs as 4 spaces):</label>'.split("$(problemNum)").join(problemNum);

        // Turn into MDL elements
        questionField.innerHTML = questionContent;
        componentHandler.upgradeElement(questionField);
        solutionField.innerHTML = solutionContent;
        componentHandler.upgradeElement(solutionField);

        // Add the wrapper to page
        document.getElementById('problems-wrapper').appendChild(newProblem);

        // Add inputs to the wrapper
        document.getElementById('problem-' + problemNum + '-content').appendChild(questionField);
        document.getElementById('solution-' + problemNum + '-content').appendChild(solutionField);
    }

    // Loads saved problems from DB and puts them in edit fields
    function loadSavedProblems(lesson, currSet){
        var problems = currSet.problems;
        // Update problemNum variable so numbering appears correctly when adding problems
        problemNum = problems.length;

        // Add input fields for the saved problems
        for(var i = 1; i < problems.length; i++){
            newProblemField(i);
        }

        // Insert saved data into the fields
        for(var i = 0; i < problems.length; i++){
            $("#problem-" + i + "-input").val(problems[i].question);
            $("#solution-" + i + "-input").val(problems[i].solution);
        }
    }

    // Iterates over all the problem fields and builds a list with their values
    function getProblemInputs(){
        var problems = [];

        // Go through each of the fields and put together the problems
        for(var i = 0; i < problemNum; i++){
            var questionText = $("#problem-" + i + "-input").val();
            var solutionText = $("#solution-" + i + "-input").val();

            // If both question and answer left empty, skip the field
            if(questionText.trim().length == 0 && solutionText.trim().length == 0){
                continue;
            } else {
                var newProblem = {
                    "question" : imageParse($("#problem-" + i + "-input").val()),
                    "solution" : parse($("#solution-" + i + "-input").val())
                }

                problems.push(newProblem);
            }
        }

        return problems;
    }

    // Sets up a click listener for when user is done making edits
    function setEditsSubmitListener(lesson, sets, currSet, setIndex){
        $(".submit-edit-btn").click(function(){
            // Get the user input from problem fields
            var newProblems = getProblemInputs();

            // Update the problems of the set with the updated ones
            currSet.problems = newProblems;
            // Update the list of all sets with this edited oen
            sets[setIndex] = currSet;
            lesson.set("sets", sets);
            lesson.save(null, {
                success: function(lesson){
                    // Reset cookies
                    document.cookie = "setIndex=; lessonId=; code=; codeResp=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                    // On complete, return to home
                    $(location).attr('href','/');
                },
                error: function(obj, error){
                    alert(error.message);
                }
            });
        });
    }

    // Extracts data from lesson list and adds radio buttons to form for lesson choice
    function addLessonOptions(lessonsList){
        var btnTemplate = '<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="option-1"> <input type="radio" id="option-$(lessonNum)" class="mdl-radio__button" name="options" value="$(lessonId)" $(checked)> <span class="mdl-radio__label mdl-card__supporting-text lesson-title">$(lessonName)</span> </label>';

        // For each lesson in list, add a radio button for lesson choice
        for(var i = 0; i < lessonsList.length; i++){
            var lessonName = lessonsList[i].lessonName;
            var lessonId = lessonsList[i].lessonId;

            // Replace fields in template with lesson data
            var processedTemplate = btnTemplate.split("$(lessonNum)").join(i);
            processedTemplate = processedTemplate.split("$(lessonId)").join(lessonId);
            processedTemplate = processedTemplate.split("$(lessonName)").join(lessonName);

            // The first button will be checked by default
            if(i == 0){
                processedTemplate = processedTemplate.split("$(checked)").join("checked");
            } else {
                processedTemplate = processedTemplate.split("$(checked)").join("");
            }

            // Add button to page
            $("#lesson-choice-buttons").append(processedTemplate);
        }
    }

    // Handles cases where angled brackets are found to not mess with HTML
    function parse(origString){
        for(var i=0;i<origString.length;i++){
            if(origString.charAt(i)=='<' && origString.charAt(i+1)!=" "){
                if(origString.substring(i+1,i+4)!="img" && origString.substring(i+1,i+5)!="/img"){
                    origString =  origString.substr(0, i) + "&lt;" + origString.substr(i + 1);
                }
            }
        }

        for(var i = 1; i < origString.length; i++){
            if(origString.charAt(i) == '>' && origString.charAt(i - 1) != " "){
                if(origString.charAt(i - 1) != "/"){
                    origString = origString.substr(0, i) + "&gt;" +  origString.substr(i + 1);
                }
            }
        }

        return origString;
    }

    // Handles image links
    function imageParse(origString){
        var openImageReplaced= origString.replace(/<img>/g,"<img width=\"400px\" src=\"")
        var closeImageReplaced = openImageReplaced.replace(/<\/img>/g,"\" />");

        for(var i = 0; i < closeImageReplaced.length; i++){
            if(closeImageReplaced.charAt(i) == '<' && closeImageReplaced.charAt(i + 1) != " "){
                if(closeImageReplaced.substring(i + 1, i + 4) != "img" && closeImageReplaced.substring(i + 1, i + 5) != "/img"){
                    closeImageReplaced =  closeImageReplaced.substr(0, i) + "&lt;" + closeImageReplaced.substr(i + 1);
                }
            }
        }

        for(var i = 1; i < closeImageReplaced.length; i++){
            if(closeImageReplaced.charAt(i) == '>' && closeImageReplaced.charAt(i - 1) != " "){
                if(closeImageReplaced.charAt(i - 1) != "/"){
                    closeImageReplaced = closeImageReplaced.substr(0, i) + "&gt;" +  closeImageReplaced.substr(i + 1);
                }
            }
        }

        return closeImageReplaced;
    }

    // Generates a 4 character code that students can use to access their questions again
    function generateCode(){
        var code = "";
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (var j = 0; j < 4; j++)
            code += chars[Math.round(Math.random() * (chars.length - 1))];

        return code;
    }

    function loadData(){
        lessonsListQuery.get("iyb8zsKB5i", {
            success: function(lessonsList) {
                var editing = checkEditing();

                // Check if in editing mode, all required data present, and if codes match
                if(editing && checkCookie("setIndex") && checkCookie("lessonId") && getCookie("code") == hash(getCookie("codeResp"))){
                    // In editing mode, update UI
                    editModeUI();

                    // Get all data for the requested lesson
                    lessonQuery.get(getCookie("lessonId"), {
                        success : function(lesson){
                            var sets = lesson.get("sets");
                            // Get the data for the set currently being edited
                            var setIndex = parseInt(getCookie("setIndex"));
                            var currSet = sets[setIndex];

                            loadSavedProblems(lesson, currSet);
                            setEditsSubmitListener(lesson, sets, currSet, setIndex);
                        },
                        error : function(obj, error){
                            alert(error.message);
                        }
                    });

                } else {
                    // Not in editing mode, build basic info form with radio buttons for lesson choice
                    addLessonOptions(lessonsList.get("lessons"));
                }
            },
            error: function(obj, error) {
                alert(error.message);
            }
        });
    }


    loadData();


    $('.add-problem-btn').click(function(){
        // Add a new field for input
        newProblemField(problemNum);
        // Increment counter for number of problems
        problemNum++;
    });

    $('.submit-problems-btn').click(function(){
        // Get name data
        var name = $("#name-input").val().trim();
        // Find which radio button is checked for lesson choice
        var lessonId = $("#lesson-choice-buttons input[type=radio]:checked").val().trim();

        var code = generateCode();

        // Get user input from the problem fields
        var problems = getProblemInputs();

        var newSet = {
            "code" : code,
            "name" : name,
            "problems" : problems
        }

        lessonQuery.get(lessonId, {
            success: function(lesson) {
                // Save set to lesson object
                lesson.add("sets", newSet);
                lesson.save(null, {
                    success: function(newSet) {
                        alert("Your work has been submitted. If you want to edit it later on, you'll need the code below to do so, so store it somewhere safe.\n\nCode: " + code);
                        // Return to home on complete
                        $(location).attr('href','/');
                    },
                    error: function(obj, error) {
                        alert(error.message);
                    }
                });
            },
            error: function(obj, error) {
                alert(error.message);
            }
        });
    });
});
