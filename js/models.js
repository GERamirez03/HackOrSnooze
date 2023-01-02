"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {storyId, title, author, url, username, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() { // IMPORTANT: URLs appear to need an http/https: prefix in order to not throw an error with Axios (400: Bad Request, URL does not conform with "uri" standards)
    const url = new URL(this.url);
    const hostname = url.hostname;
    return hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // Answer: It does not make sense for getStories to be an instance method because
    // its functionality does not vary depending on the instance of StoryList.
    // getStories executes the same process every time, so we should make it
    // a static class method. We will have to call it as StoryList.getStories()

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) { /* user,  newStory */
    /** To create a new story in the API,
     * 1) we need to make a POST request to BASE_URL + "/stories" 
     * 2) we need an object containing...
     * ---- a TOKEN: comes from user.loginToken
     * ---- a STORY OBJECT: { "author": newStory.author, "title": newStory.title, "url": newStory.url }
     * NOTICE that the newStory object passed in as an argument is ALREADY in the format that 
     * the API needs, so in the request we can write the request body as:
     * { "token": user.loginToken, "story": newStory }
    */

    // Adding story data to API by making a POST request to BASE_URL + "/stories"
    const response = await axios.post( BASE_URL + "/stories",
    {
      "token": user.loginToken,
      "story": newStory,
    });

    // creating a new Story instance with the data from the API's response
    const story = new Story(response.data.story);

    // adding this new Story instance to the Story List
    this.stories.push(story);

    // return new Story instance
    return story;
  }

  // Looking at responses from the API, it appears that a user can only remove a story if they are the ones who posted it
  async removeStory(user, targetStory) {
    if (!user) return; // if the current user is not logged in, don't remove the story

    try {
      const response = await axios({
        url: `${BASE_URL}/stories/${targetStory.storyId}`,
        method: "DELETE",
        params: { "token": user.loginToken }
      });

      console.debug(response.data.message);

      const storyIndex = this.stories.indexOf(targetStory);
      this.stories.splice(storyIndex, 1);

      return this.stories;

    } catch (error) {
        console.error("removeStory failed", error);
        return null;
    }
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it. // QUESTION: So this is actually creating a new user instance every time, even after they have already signed up?

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  async favoriteStory(story) {
    try {
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: "POST",
      params: { "token": this.loginToken },
    });

    console.debug(response.data.message);

    this.favorites.push(story);

    } catch (error) {
      console.error("favoriteStory failed", error);
      return null;
    }
  }

  async unfavoriteStory(story) {
    try {
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: "DELETE",
      params: { "token": this.loginToken },
    });

    console.debug(response.data.message);

    const storyIndex = this.favorites.indexOf(story);
    this.favorites.splice(storyIndex, 1);

    } catch (error) {
      console.error("unfavoriteStory failed", error);
      return null;
    }
  }

  
  // helper method which uses the find method on the user's favorites array to return a boolean depending on whether or not a given story is already in there
  
  storyInFavorites(story) {
    
    // debug message
    console.debug("storyInFavorites");

    // if the story is found by storyId in the user's Favorites array, return true
    if (this.favorites.find( favoriteStory => favoriteStory.storyId === story.storyId )) return true;

    // if the story is NOT found, return false
    return false;
  }


  // a method which determines whether to favorite or unfavorite a given story using storyInFavorites
  
  toggleFavoriteStory(story) {
    
    // debug message
    console.debug("User.toggleFavoriteStory");

    // if the story is in the user's favorites array, unfavorite it
    if (this.storyInFavorites(story)) this.unfavoriteStory(story);

    // otherwise, the story is not already a favorite, so favorite it
    else this.favoriteStory(story);

  }

}
