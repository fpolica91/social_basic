import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  CACHE_MANAGER,
  Inject,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Cache } from 'cache-manager';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Public } from 'src/auth/public.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly postsService: PostsService,
  ) {}

  @Post()
  create(@Body() createPostDto: Partial<CreatePostDto>, @Request() req?: any) {
    const createPostObject = Object.assign({}, createPostDto, {
      user_id: req.principal.userId,
      user_email: req.principal.email,
    }) as CreatePostDto;

    return this.postsService.create(createPostObject);
  }

  @Public()
  @Get()
  async findAllPublic() {
    const cachedPosts = await this.cacheManager.get('posts');
    if (cachedPosts) {
      console.log('Returning cached posts');
      return cachedPosts;
    }
    console.log('returning fresh posts');
    const publicPosts = await this.postsService.findPublic();
    await this.cacheManager.set('posts', publicPosts, { ttl: 10 });
    return publicPosts;
  }

  @Get('/by_user')
  async findMyPosts(@Request() req: any) {
    return await this.postsService.findMyPosts(req.principal.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    const updatePostObject = Object.assign({}, updatePostDto, {
      user_id: req.principal.userId,
      user_email: req.principal.email,
    });

    return this.postsService.likePost(id, updatePostObject);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
