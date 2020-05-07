import { Controller, Post, Body, UseInterceptors, Param, UploadedFile, Req, Delete } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { ArticleService } from "src/services/article/article.service";
import { Article } from "src/entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from "multer";
import { PhotoService } from "src/services/photo/photo.service";
import { ArticleFeature } from "src/entities/article-feature.entity";
import { Photo } from "src/entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { StorageConfig } from "config/storage.config";
import * as fileType from 'file-type';
import * as fs from 'fs';
import * as sharp from 'sharp';

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
                destination: StorageConfig.photo.destination,
                filename: (req, file, callback) => {
                    //'Neka slika.jpg' ->
                    //2020420-865893484-Neka-slika.jpg

                    let original: string = file.originalname;

                    let normalized = original.replace(/\s+/g, '-');
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
                    req.fileFilterError = 'Bad file extensions!';
                    callback(null, false);
                    return;
                }
                //2.
                if(!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))){
                    req.fileFilterError = 'Bad file content!';
                    callback(null, false);
                    return;
                }
                callback(null, true);
            },
            limits: {
                files: 1,
                fileSize: StorageConfig.photo.maxSize
            },

        })
    )
   async uploadPhoto(
       @Param('id') articleId: number,
        @UploadedFile() photo,
        @Req() req
        ): Promise<ApiResponse | Photo>{
            
            if(req.fileFilterError){
                return new ApiResponse('error', -4002, req.fileFilterError);
            }

            if(!photo){
                return new ApiResponse('error', -4002, 'File not uploaded!');
            }
            //Real mime type check 
            const fileTypeResult = await fileType.fromFile(photo.path);
            if(!fileTypeResult){
                //obrisati taj fajl
                fs.unlinkSync(photo.path);
                return new ApiResponse('error', -4002, 'Cannot detect file type!');
            }

        const realMimeType = fileTypeResult.mime;
        if(!(realMimeType.includes('jpeg') || realMimeType.includes('png'))){
             //obrisati taj fajl
             fs.unlinkSync(photo.path);
             return new ApiResponse('error', -4002, 'Bad file content type!');
        }

        //Save a resized file
        await this.createResizedImage(photo, StorageConfig.photo.resize.thumb);
        await this.createResizedImage(photo, StorageConfig.photo.resize.small);

        const newPhoto: Photo = new Photo();
        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;
        const savedPhoto = await this.photoService.add(newPhoto);
        if(!savedPhoto){
            return new ApiResponse('error', -4001);
        }
        return savedPhoto;
    }

    async createResizedImage(photo, resizeSettings){
        const orginalFilePath = photo.path;
        const fileName = photo.filename;

        const destinationFilePath = StorageConfig.photo.destination + resizeSettings.directory + fileName;

        await sharp(orginalFilePath)
                .resize({
                    fit: 'cover',
                    width: resizeSettings.width,
                    height: resizeSettings.height
                })
                .toFile(destinationFilePath);
    }
    //http://localhost:3000/api/article/1/delete/32
    @Delete(':articleId/deletePhoto/:photoId')
    public async deletePhoto(
        @Param('articleId') articleId: number,
        @Param('photoId') photoId: number){
            const photo = await this.photoService.findOne({
                articleId: articleId,
                photoId: photoId
            });
            if(!photo){
                return new ApiResponse('error', -4004, 'Photo not found!');
            }
            try{
            fs.unlinkSync(StorageConfig.photo.destination + photo.imagePath);
            fs.unlinkSync(StorageConfig.photo.destination + 
                StorageConfig.photo.resize.thumb.directory + 
                photo.imagePath);
            fs.unlinkSync(StorageConfig.photo.destination + 
                StorageConfig.photo.resize.small.directory + 
                photo.imagePath);    
            }
            catch(e){}
            
            const deleteResult = await this.photoService.deleteById(photoId);

            if(deleteResult.affected === 0){
                return new ApiResponse('error', -4004, 'Photo not founded!');
            }
            return new ApiResponse('ok', 0, 'One photo deleted!');
        }
}