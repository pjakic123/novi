export class AddArticleDto {
    name: string;
    categoryId: number;
    excerpt: string;
    description: string;
    price: number;
    features: {
        featureId: number;
        value: string;
    }[];
}
/*
{
"name": "Acme SDD HD11 1TB",
"categoryId" : 5,
"excerpt": "Kratak opis proizvoda",
"description": "Detaljan opis",
"features": [
    {
        "featureId": 1, "value": "1TB",
        "featureId": 3, "value": "SSD"
    }
]
}
*/