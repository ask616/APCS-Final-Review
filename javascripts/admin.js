$(document).ready(function(){

    // Connect to our database
    Parse.initialize("gV7nKoiPMnEPz2WAvVNdlLnIE3rdMGCVTywuGxhg", "9pxUUwLlmOdB9C54yxvYH38c7YVtNvWYyMbNoPjS");

    var LessonsListClass = Parse.Object.extend("LessonsList");
    var LessonClass = Parse.Object.extend("Lesson");

    var lessonsListQuery = new Parse.Query(LessonsListClass);


    // Basic hash function
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

    // CHecks to see if admin has used correct password
    function validatePassword(){
        return hash($("#pw").val()) == -723347208;
    }

    // Leaves the appropriate control button for database access
    function checkAccessStatus(enabled){
        if(enabled){
            $("#enable-access-btn").hide();
        } else {
            $("#disable-access-btn").hide();
        }
    }

    // Goes through array of all lesson objects, and returns array of their names
    function getLessonNames(lessonList){
        lessonNames = [];
        for(var i = 0; i < lessonList.length; i++){
            lessonNames.push(lessonList[i].lessonName);
        }
        return lessonNames;
    }

    // Builds a table with lessons from DB and adds to dash
    function buildLessonsTable(lessonNames){
        var table = document.createElement('table');
        table.className = "mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp lessons-table";

        var tableBody = "";
        for(var i = 0; i < lessonNames.length; i++){
            var lessonName = lessonNames[i];

            var preProcessed = '<tr id="$(lessonNum)"><td class="mdl-data-table__cell--non-numeric">$(lessonName)</td></tr>';

            // Replaces all instances of tokenizer with new value
            var processed = preProcessed.split("$(lessonNum)").join(i);
            processed = processed.split("$(lessonName)").join(lessonName);

            tableBody += processed;

        }

        // Insert processed table body into table tags
        var tableBodyPreProcessed = '<thead><tr><th class="mdl-data-table__cell--non-numeric">Lesson Name</th></tr></thead><tbody>$(tableBody)</tbody>';
        tableBodyProcessed = tableBodyPreProcessed.split("$(tableBody)").join(tableBody);
        table.innerHTML = tableBodyProcessed;

        // Use MDL framework method for UI effects
        componentHandler.upgradeElement(table);

        // Add to page
        $("#lessons-table-wrapper").html(table);
    }

    // The index of the lesson within the master list is stored in the table row's ID
    // This function gets those values and returns an array of them.
    function getSelectedIndices(selectedLessons){
        var selectedIndices = [];
        for(var i = 0; i < selectedLessons.length; i++){
            selectedIndices.push(parseInt(selectedLessons[i].id));
        }
        return selectedIndices;
    }

    function loadData(){
        lessonsListQuery.get("iyb8zsKB5i", {
            success: function(lessonsList) {

                checkAccessStatus(lessonsList.get("access"));

                lessonsList = lessonsList.get("lessons");
                var lessonNames = getLessonNames(lessonsList);

                if(lessonNames.length == 0){
                    // If no lessons available, don't build table
                    $("#lessons-table-wrapper").html('<div class="mdl-card__supporting-text">No lessons available.</div>');
                    $("#remove-lessons-button").attr("disabled", true);
                    $("#remove-lessons-button").addClass("mdl-color-text--grey-400");
                } else {
                    // Otherwise, build a table to display all lessons
                    buildLessonsTable(lessonNames)
                }

            },
            error: function(object, error) {
                alert(error.message)
            }
        });
    }


    loadData();


    $(".access-button").click(function(e){

        // Check password
        if(!validatePassword()){
            alert("Incorrect password");
            return;
        }

        // Check which button was pressed (enable or disable)
        var buttonType = e.target.parentNode.id.replace("-access-btn", "");
        buttonType = (buttonType === 'enable');

        lessonsListQuery.get("iyb8zsKB5i", {
            success: function(lessonsList) {
                // Update access value
                lessonsList.set("access", buttonType)
                lessonsList.save(null, {
                    success: function(obj){
                        // Reload page on complete
                        location.reload();
                    },
                    error: function(obj, error){
                        alert(error.message);
                    }
                });
            },
            error: function(obj, error){
                alert(error.message);
            }
        });

    });

    $("#add-lesson-button").click(function(){

        // Check password
        if(!validatePassword()){
            alert("Incorrect password");
            return;
        }

        var newLessonName = prompt("Enter a name for the new lesson:");

        if(newLessonName != null){
            if(newLessonName.trim().length == 0){
                alert("Invalid lesson name");
            } else {
                // Callback hell
                // Build new lesson and save it
                var newLesson = new LessonClass();
                newLesson.set("name", newLessonName);
                newLesson.set("sets", []);

                newLesson.save(null, {
                    success: function(newLesson) {
                        // Next, we need to add its ID to the master list of all lessons
                        lessonsListQuery.get("iyb8zsKB5i", {
                            success: function(lessonsList) {

                                // Build object with lesson ID and name
                                var newLessonObj = {
                                    "lessonId" : newLesson.id,
                                    "lessonName" : newLessonName
                                }

                                // Append it to the master list array
                                lessonsList.add("lessons", newLessonObj);
                                lessonsList.save(null, {
                                    success: function(newSet) {
                                        // Reload on complete
                                        location.reload();
                                    },
                                    error: function(obj, error) {
                                        alert(error.message);
                                    }
                                });

                            }, error: function(obj, error) {
                                alert(error.message)
                            }
                        });
                    },
                    error: function(obj, error) {
                        alert(error.message)
                    }
                });
            }
        }
    });

    $("#remove-lessons-button").click(function(){

        // Check PW
        if(!validatePassword()){
            alert("Incorrect password");
            return;
        }

        // Get list of all the lessons that were selected
        var selectedLessons = $(".is-selected");

        if(selectedLessons.length == 0){
            alert("No lessons selected");
            return;
        }

        var confirmed = confirm("Are you sure you want to remove these lessons?");

        if(!confirmed){
            return;
        }

        var selectedIndices = getSelectedIndices(selectedLessons);

        lessonsListQuery.get("iyb8zsKB5i", {
            success: function(lessonsList) {

                var lessonsArray = lessonsList.get("lessons");
                // This list will store the names of lessons removed from the master list
                var lessonNames = [];

                for(var i = lessonsArray.length; i--;) {
                    if(i == selectedIndices[selectedIndices.length-1]) {
                        // If at one of the correct indices, store the name and remove it from the array
                        var currLesson = lessonsArray[i];
                        lessonNames.push(currLesson.lessonName);

                        lessonsArray.splice(i, 1);
                        // Remove the last element of the index array, as we're traversing backwards
                        selectedIndices.pop();
                    }
                }

                // Update the master list with the updated array
                lessonsList.set("lessons", lessonsArray);

                lessonsList.save(null, {
                    success: function(newSet) {
                        // Build a query that checks if the name of a lesson is in the array built earlier
                        var lessonQuery = new Parse.Query(LessonClass);
                        lessonQuery.containedIn("name", lessonNames);
                        // Traversing through all the lesson objects, delete any that match
                        lessonQuery.each(function(lesson) {
                            return lesson.destroy();
                        }).then(function() {
                            // Reload on completion
                            location.reload();
                        }, function(obj, error) {
                            alert(error.message)
                        });
                    },
                    error: function(obj, error) {
                        alert(error.message);
                    }
                });
            }, error: function(obj, error) {
                alert(error.message)
            }
        });

    });

    $("#clear-db-btn").click(function(){

        if(!validatePassword()){
            alert("Incorrect password");
            return;
        }

        var confirmed = confirm("Are you sure you want to empty the database? The lessons will be preserved, but all student questions will be lost. Page will refresh on completion.")

        if(!confirmed){
            return;
        }

        var lessonQuery = new Parse.Query(LessonClass);
        // Go through each Lesson object and reset its sets field
        lessonQuery.each(function(lesson) {
            lesson.set("sets", []);
            return lesson.save();
        }).then(function() {
            // Reload on completion
            location.reload();
        }, function(error) {
            alert(error.message);
        });
    });

});
