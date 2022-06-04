import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePostDto } from './dto/create-post.dto';
import { Post, PostDocument } from './schemas/post.schema';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async findMyPosts(userId: string) {
    const myPosts = await this.postModel.find({ user_id: userId }).exec();
    return myPosts;
  }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const createdPost = new this.postModel(createPostDto);
    return createdPost.save();
  }

  async findPublic() {
    const posts = await this.postModel
      .find({ isPublic: true })
      .sort('likes')
      .exec();
    return posts;
  }

  findOne(id: string) {
    return `This action returns a #${id} post`;
  }

  async dislikePost(id: string, updatePostDto: UpdatePostDto) {
    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      {
        $inc: { likes: -1 },
        $pull: {
          likedBy: {
            user_id: updatePostDto.user_id,
            user_email: updatePostDto.user_email,
          },
        },
      },
      // returns the updated document
      { new: true },
    );

    await updatedPost.save();
    return updatedPost;
  }

  async likePost(id: string, updatePostDto: UpdatePostDto) {
    const postLikedAlready = await this.postModel
      .findOne({
        _id: id,
        likedBy: { $elemMatch: { user_id: updatePostDto.user_id } },
      })
      .exec();

    if (postLikedAlready) {
      if (postLikedAlready.likes > 0) {
        const dislikedPost = await this.dislikePost(id, updatePostDto);
        return dislikedPost;
      }
      return postLikedAlready;
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      {
        $inc: { likes: 1 },
        $push: {
          likedBy: {
            user_id: updatePostDto.user_id,
            user_email: updatePostDto.user_email,
          },
        },
      },
      // returns the updated document
      { new: true },
    );

    await updatedPost.save();
    return updatedPost;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
