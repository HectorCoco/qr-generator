export interface CategoryResponse {
    count: number
    next: string
    previous: null
    results: Result[]

}


export interface Result {
    categoryType: string
    name: string
    active: true
}

export const Categories = [
    {
        "categoryType": "images",
        "name": "images",
        "active": true,
    },
    {
        "categoryType": "documents",
        "name": "documents",
        "active": true,
    },
    {
        "categoryType": "links",
        "name": "links",
        "active": true,
    },
]