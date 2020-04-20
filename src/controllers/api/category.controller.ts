import { Controller } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { Category } from "entities/category.entity";
import { CategoryService } from "src/services/category/category.service";

@Controller('api/category')
@Crud({
    model: {
        type: Category
    },
    params: {
        id: {
            field: 'categoryId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join: {
            //prvo ovo samo dodati i o njemu pricati
            categories: {
                eager: true
            },
			//cetvrta
            articles: {
                eager: false
            },
            //druga ruta je ova pa nju dodati pa o njoj pricati
            parentCategory: {
                eager: false
            },
            //treca
            features: {
                eager: true
            }
        }
    }
})
export class CategoryController{
    constructor(public service: CategoryService){ }
}