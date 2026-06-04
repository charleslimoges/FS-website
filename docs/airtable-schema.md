# Airtable Schema Documentation

## Base ID: `appFNSgmVZkW5d2t3`

---

## Table: `Buildings`

| Field Name      | Type               | Notes                                           |
|-----------------|--------------------|-------------------------------------------------|
| `name`          | Single line text   | Building display name                           |
| `address`       | Single line text   | Full address (used for lookup)                  |
| `neighbourhood` | Single select      | One of: Downtown, Plateau, Rosemont, etc.       |
| `images`        | Attachments        | Building photos (first shown on card)           |
| `min_price`     | Number             | Lowest unit price in this building              |
| `max_price`     | Number             | Highest unit price in this building             |
| `amenities`     | Multiple select    | gym, pool, rooftop, parking, concierge, storage, bike_storage, laundry, elevator, balcony, terrace, dog_wash |
| `description`   | Long text          | Building description for detail pages           |
| `unit_count`    | Number             | Total number of units in the building           |
| `published`     | Checkbox           | `true` = visible on the website                 |

---

## Table: `Units`

| Field Name            | Type               | Notes                                           |
|-----------------------|--------------------|-------------------------------------------------|
| `unit_number`         | Single line text   | e.g. "4B", "101", "PH2"                         |
| `building_id`         | Link to Buildings  | Linked record to the Buildings table            |
| `price`               | Number             | Monthly rent in CAD                             |
| `bedrooms`            | Number             | 0 = studio, 1, 2, 3, 4+                        |
| `bathrooms`           | Number             | e.g. 1, 1.5, 2, 2.5                            |
| `sqft`                | Number             | Square footage                                   |
| `images`              | Attachments        | Unit photos                                     |
| `available_date`      | Date               | Date the unit becomes available (ISO format)    |
| `promo`               | Checkbox           | `true` = has a promotional offer                |
| `parking`             | Single select      | `none`, `included`, `available`                 |
| `utilities_included`  | Checkbox           | Heat/electricity/water included                 |
| `appliances`          | Multiple select    | washer_dryer, dishwasher, fridge, stove, microwave, air_conditioning |
| `amenities`           | Multiple select    | Same values as building amenities               |
| `pets`                | Single select      | `yes`, `no`, `cats_only`                        |
| `furnished`           | Checkbox           | Unit comes furnished                            |
| `floor`               | Number             | Floor number                                    |
| `description`         | Long text          | Unit-specific description                       |
| `status`              | Single select      | `available` or `rented`                         |
| `published`           | Checkbox           | `true` = visible on the website                 |

---

## Table: `Contact Submissions`

| Field Name            | Type               | Notes                              |
|-----------------------|--------------------|------------------------------------|
| `name`                | Single line text   | Submitter's name                   |
| `email`               | Email              | Submitter's email                  |
| `phone`               | Phone              | Optional                           |
| `message`             | Long text          | Message content                    |
| `interested_in_unit`  | Checkbox           | Whether they specified a unit      |
| `unit_or_building`    | Single line text   | Unit/building reference if given   |

---

## Table: `Visit Bookings`

| Field Name       | Type               | Notes                                     |
|------------------|--------------------|-------------------------------------------|
| `name`           | Single line text   | Visitor's name                            |
| `email`          | Email              | Visitor's email                           |
| `phone`          | Phone              | Visitor's phone                           |
| `preferred_date` | Date               | Requested visit date                      |
| `preferred_time` | Single line text   | e.g. "2:00 PM"                            |
| `unit_id`        | Single line text   | Airtable record ID of the unit            |
| `building_id`    | Single line text   | Airtable record ID of the building        |
| `notes`          | Long text          | Optional notes from the visitor           |

---

## Notes

- All `published` fields must be `true` for records to appear on the website
- The `building_id` field in Units is a Linked Record — it returns an array of IDs
- `amenities` and `appliances` are stored as multiple-select arrays
- Images are Airtable Attachment fields — thumbnails are auto-generated by Airtable
- Neighbourhood values must match exactly: `Downtown`, `Plateau`, `Rosemont`, `Hochelaga`, `Mile-End`, `Verdun`, `Saint-Henri`, `Griffintown`, `Outremont`, `NDG`, `Villeray`, `Pointe-Saint-Charles`
