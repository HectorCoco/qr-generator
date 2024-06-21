export interface LocationResponse {
    count: number
    next: string
    previous: null
    results: Result[]

}


export interface Result {
    locationNumber: number
    name: string
    active: true
}

export const Locations = [
    {
        "locationNumber": 1,
        "name": "beach club",
        "active": true,
    },
    {
        "locationNumber": 3,
        "name": "cancun",
        "active": true,
    },
    {
        "locationNumber": 4,
        "name": "punta cana",
        "active": true,
    },
    {
        "locationNumber": 5,
        "name": "playa del carmen",
        "active": true,
    },
]