export class Post {
  constructor(id, author, content) {
    this.id = id;
    this.author = author;
    this.content = content;

    this.comments = [];

    let likeCount = 0;

    this.like = () => {
      likeCount++;
    };

    this.unlike = () => {
      if (likeCount > 0) {
        likeCount--;
      }
    };

    // Getter
    Object.defineProperty(this, "likes", {
      get() {
        return likeCount;
      },
    });
  }

  addComment(comment) {
    this.comments.push(comment);
  }

  get commentCount() {
    return this.comments.length;
  }
}


export class Tweet extends Post {
  constructor(id, author, content) {
    super(id, author, content);

    this.type = "tweet";
  }
}


export class Retweet extends Post {
  constructor(id, author, originalPost) {
    super(id, author, originalPost.content);

    this.originalPost = originalPost;

    this.type = "retweet";
  }
}