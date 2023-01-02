"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}


/** When a user clicks on the submit link in the navbar, show the form to submit a story */

function displayStorySubmissionForm(event) {
  console.debug("displayStorySubmissionForm", event);
  // hidePageComponents();
  $storySubmissionForm.show();

}

$navStory.on("click", displayStorySubmissionForm);


// funciton here for navigation: clicking on Favorite Stories button ????

function navShowFavoriteStories(event) {
  console.debug("navShowFavoriteStories", event); // , event);

  hidePageComponents();
  putFavoriteStoriesOnPage();
}

$navFavoriteStories.on("click", navShowFavoriteStories);