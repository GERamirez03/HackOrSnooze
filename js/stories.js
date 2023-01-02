"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username} <a class="toggle-favorite-story" href="#">Toggle Favorite Story</a><div></div><a class="remove-story" href="#">REMOVE</a></small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}


// function which puts all of the user's favorite stories on the page

function putFavoriteStoriesOnPage() {

  // debug message that this function was called
  console.debug("putFavoriteStoriesOnPage");

  // empty the stories list
  $allStoriesList.empty();

  // loop through all of current user's favorite stories, generate HTML for them, and append them to the stories list
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  // display the new updated story list with just the user's favorites
  $allStoriesList.show();
}


async function createNewStory(event){
  console.debug("createNewStory", event);
  event.preventDefault();

  // grab the title, author, and url of the new story
  const title = $("#new-story-title").val();
  const author = $("#new-story-author").val();
  const url = $("#new-story-url").val();

  // call addStory
  const story = await storyList.addStory(currentUser, {
    author,
    title,
    url,
  });

  // reset the new story form
  $storySubmissionForm.trigger("reset");

  // generate the HTML for the new story and append it to the story list to display
  const $story = generateStoryMarkup(story);
  $allStoriesList.append($story);
}

$storySubmissionForm.on("submit", createNewStory);

// helper function which accepts an event as a target and returns the clicked story's Story object

function getClickedStory(event) {

  // debug that getClickedStory was called
  console.debug("getClickedStory", event);

  // use jQuery to identify the li element of the clicked story
  const $targetStory = $(event.target).closest("li");

  // use jQuery to grab the id of the clicked story
  const targetStoryId = $targetStory.attr("id");

  // use the Array.filter method to retrieve the story object which corresponds to the clicked story
  const targetStoryObject = storyList.stories.filter( story => story.storyId === targetStoryId )[0];

  // debug to display the clicked story's corresponding story object
  console.debug("targetStoryObject", targetStoryObject);

  // return the story object of the clicked story
  return targetStoryObject;
}


async function removeStory(event) {
  
  console.debug("removeStory", event);
  event.preventDefault();

  // grab the target story's li from the DOM
  const $targetStory = $(event.target).closest("li");

  // grab the story object corresponding to the story user wants to remove
  const targetStoryObject = getClickedStory(event);

  // remove the target story's li from the DOM
  $targetStory.remove();

  // call the story list method to remove the story from the API
  const newStoryList = await storyList.removeStory(currentUser, targetStoryObject);

  // debug message the new story list
  console.debug(newStoryList);
}

$allStoriesList.on("click", ".remove-story", removeStory);


// helper function which passes a clicked story's Story object to the current user's toggleFavoriteStory method 

function toggleFavoriteStory(event) {

  // debug that toggleFavoriteStory was called
  console.debug("toggleFavoriteStory");

  // call getClickedStory to retrieve the story object of the clicked story
  const targetStoryObject = getClickedStory(event);

  // pass the story object to the currentUser's toggleFavoriteStory function
  currentUser.toggleFavoriteStory(targetStoryObject);

}

$allStoriesList.on("click", ".toggle-favorite-story", toggleFavoriteStory);