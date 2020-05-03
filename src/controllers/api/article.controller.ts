import { Controller, Post, Body, UseInterceptors, Param, UploadedFile } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { ArticleService } from "src/services/article/article.service";
import { Article } from "entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from "multer";
import { PhotoService } from "src/services/photo/photo.service";
import { ArticleFeature } from "entities/article-feature.entity";
import { Photo } from "entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { StorageConfig } from "config/storage.config";

@Controller('api/article')
@Crud({
    model: {
        type: Article
    },
    params: {
        id: {
            field: 'articleId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join: {
            category: {
                eager: true
            },
            photos: {
                eager: true
            },
            articlePrices: {
                eager: true
            },
            articleFeatures: {
                eager: true
            },
            //sada smo ovo dodali
            features: {
                eager: true
            }
           
        }
    }
})
export class ArticleController{
    constructor(
        public service: ArticleService,
        public photoService: PhotoService,
        ){ }

    @Post('createFull')  //POST http://localhost:3000/api/article/createFull
    createFullArticle(@Body() data: AddArticleDto){
        return this.service.createFullArticle(data);
    }

    @Post(':id/uploadPhoto')
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: StorageConfig.photosDestination,
                filename: (req, file, callback) => {
                    //'Neka slika.jpg' ->
                    //2020420-865893484-Neka-slika.jpg

                    let original: string = file.originalname;

                    let normalized = original.replace(/\S+/g, '-');
                    normalized = normalized.replace(/[^A-z0-9\.\-]/g, '');

                    let sada = new Date();
                    let datePart = '';
                    datePart += sada.getFullYear().toString();
                    datePart += (sada.getMonth() + 1).toString();
                    datePart += sada.getDate().toString();

                    let randomPart: string =
                        new Array(10)
                        .fill(0)
                        .map(e => (Math.random() * 9).toFixed(0).toString())
                        .join('');

                    let fileName = datePart + '-' + randomPart + '-' + normalized;
                    fileName = fileName.toLocaleLowerCase();
                    callback(null, fileName);
                }
            }),
            fileFilter: (req, file, callback) => {
                //1. 
                if (!file.originalname.match(/\.(jpg|png)$/)){
                    callback(new Error('Bad file extensions!'), false);
                    return;
                }
                //2.
                if(!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))){
                    callback(new Error('Bad file content!'), false);
                    return;
                }
                callback(null, true);
            },
            limits: {
                files: 1,
                fileSize: StorageConfig.photoMaxSize
            },

        })
    )
   async uploadPhoto(@Param('id') articleId: number, @UploadedFile() photo): Promise<ApiResponse | Photo>{
        const newPhoto: Photo = new Photo();
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;
        const savedPhoto = await this.photoService.add(newPhoto);
        if(!savedPhoto){
            return new ApiResponse('error', -4001);
        }
        return savedPhoto;
    }
}