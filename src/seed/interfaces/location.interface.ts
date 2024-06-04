export interface LocationResponse {
    count: number
    next: string
    previous: null
    results: Result[]

}


export interface Result {
    location_number: number
    name: string
    active: true
}






[
    {
        "location_number": 1,
        "name": "beach club",
        "active": true,
    },
    {
        "location_number": 3,
        "name": "cancun",
        "active": true,
    },
    {
        "location_number": 4,
        "name": "punta cana",
        "active": true,
    },
    {
        "location_number": 5,
        "name": "playa del carmen",
        "active": true,
    },
]