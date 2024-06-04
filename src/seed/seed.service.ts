import { Injectable } from '@nestjs/common';


@Injectable()
export class SeedService {

  executeSeed() {
    const locations = [
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

    // locations.forEach(location => {
    //   console.log(location.name, location.location_number)
    // });

    return locations

  }


}
