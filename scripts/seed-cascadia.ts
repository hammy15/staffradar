import { Pool } from "@neondatabase/serverless";

const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Z3DqniV6GejI@ep-shiny-truth-akda3cw0-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require",
});

// All 57 Cascadia Healthcare facilities — parsed from roster
const FACILITIES = [
  // IDAHO (28)
  { fid: 117, name: "Arbor Valley", city: "Boise", state: "ID", type: "SNF", ownership: "Leased", beds: 148, ccn: "135079", overall: 4, health: 3, qm: 5, occ: 67, rn_hrs: 0.564, turnover: 54, rev: 13680000, net: 530000, ebitdar: 2710000, sff: false, status: "on_track" },
  { fid: 108, name: "Aspen Park", city: "Moscow", state: "ID", type: "SNF", ownership: "Leased", beds: 66, ccn: "135093", overall: 3, health: 4, qm: 4, occ: 73, rn_hrs: 0.407, turnover: 56, rev: 13180000, net: 712000, ebitdar: 1840000, sff: false, status: "watch" },
  { fid: 103, name: "CDA", city: "Coeur d'Alene", state: "ID", type: "SNF", ownership: "Leased", beds: 83, ccn: "135042", overall: 1, health: 1, qm: 4, occ: 82, rn_hrs: 0.458, turnover: 62, rev: 10570000, net: 55000, ebitdar: 3520000, sff: false, status: "urgent" },
  { fid: 107, name: "Caldwell Care", city: "Caldwell", state: "ID", type: "SNF", ownership: "Leased", beds: 66, ccn: "135014", overall: 2, health: 2, qm: 4, occ: 85, rn_hrs: 0.533, turnover: 39, rev: 8220000, net: 320000, ebitdar: 2780000, sff: false, status: "watch" },
  { fid: 105, name: "Canyon West", city: "Caldwell", state: "ID", type: "SNF", ownership: "Leased", beds: 81, ccn: "135051", overall: 4, health: 3, qm: 5, occ: 83, rn_hrs: 0.726, turnover: 52, rev: 12610000, net: 603000, ebitdar: 2740000, sff: false, status: "on_track" },
  { fid: 113, name: "Cascadia of Boise", city: "Boise", state: "ID", type: "SNF", ownership: "Leased", beds: 99, ccn: "135079", overall: 4, health: 3, qm: 5, occ: 95, rn_hrs: 0.564, turnover: 54, rev: 13680000, net: 530000, ebitdar: 2850000, sff: false, status: "on_track" },
  { fid: 112, name: "Cascadia of Nampa", city: "Nampa", state: "ID", type: "SNF", ownership: "Leased", beds: 99, ccn: "135019", overall: 1, health: 1, qm: 4, occ: 87, rn_hrs: 0.670, turnover: 50, rev: 12670000, net: -77000, ebitdar: 4090000, sff: true, status: "urgent" },
  { fid: 119, name: "Cherry Ridge", city: "Emmett", state: "ID", type: "SNF", ownership: "Leased", beds: 38, ccn: "135095", overall: 3, health: 2, qm: 5, occ: 84, rn_hrs: 0.662, turnover: 55, rev: 4190000, net: 166000, ebitdar: 1000000, sff: false, status: "on_track" },
  { fid: 102, name: "Clearwater Health", city: "Orofino", state: "ID", type: "SNF", ownership: "Leased", beds: 60, ccn: "135048", overall: 5, health: 4, qm: 5, occ: 69, rn_hrs: 0.786, turnover: 44, rev: 6320000, net: 149000, ebitdar: 1500000, sff: false, status: "on_track" },
  { fid: 127, name: "Eagle Rock", city: "Idaho Falls", state: "ID", type: "SNF", ownership: "Leased", beds: 113, ccn: "135092", overall: 3, health: 3, qm: 4, occ: 30, rn_hrs: 1.017, turnover: 50, rev: 4140000, net: 279000, ebitdar: 2190000, sff: false, status: "watch" },
  { fid: 109, name: "Lewiston Transitional", city: "Lewiston", state: "ID", type: "SNF", ownership: "Leased", beds: 71, ccn: "135021", overall: 4, health: 4, qm: 2, occ: 93, rn_hrs: 0.503, turnover: 33, rev: 12600000, net: 734000, ebitdar: 3180000, sff: false, status: "watch" },
  { fid: 133, name: "Meadow View ALF", city: "Emmett", state: "ID", type: "ALF", ownership: "New", beds: 80, ccn: null, overall: null, health: null, qm: null, occ: null, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: null, sff: false, status: "on_track" },
  { fid: 106, name: "Mountain Valley", city: "Kellogg", state: "ID", type: "SNF", ownership: "Leased", beds: 68, ccn: "135065", overall: 4, health: 4, qm: 4, occ: 91, rn_hrs: 0.644, turnover: 33, rev: 10990000, net: 341000, ebitdar: 3420000, sff: false, status: "on_track" },
  { fid: 131, name: "Paradise Creek", city: "Moscow", state: "ID", type: "SNF", ownership: "Leased", beds: 62, ccn: "135067", overall: 2, health: 2, qm: 4, occ: 63, rn_hrs: 0.714, turnover: 69, rev: 4780000, net: -367000, ebitdar: 1810000, sff: false, status: "watch" },
  { fid: 132, name: "Paradise Creek Retirement", city: "Moscow", state: "ID", type: "ILF", ownership: "Leased", beds: 157, ccn: "135067", overall: null, health: null, qm: null, occ: 111, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 2240000, sff: false, status: "on_track" },
  { fid: 118, name: "Payette Health", city: "Payette", state: "ID", type: "SNF", ownership: "Leased", beds: 60, ccn: "135015", overall: 5, health: 4, qm: 3, occ: 74, rn_hrs: 1.303, turnover: 37, rev: 6050000, net: 63000, ebitdar: 1070000, sff: false, status: "on_track" },
  { fid: 124, name: "Royal Plaza", city: "Lewiston", state: "ID", type: "SNF", ownership: "Leased", beds: 63, ccn: "135116", overall: 4, health: 4, qm: 3, occ: 72, rn_hrs: 0.972, turnover: 42, rev: 8100000, net: -961000, ebitdar: 633000, sff: false, status: "on_track" },
  { fid: 125, name: "Royal Plaza Senior Living", city: "Lewiston", state: "ID", type: "ALF", ownership: "Leased", beds: 110, ccn: "135116", overall: null, health: null, qm: null, occ: 84, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 51000, sff: false, status: "on_track" },
  { fid: 101, name: "Shaw Mountain", city: "Boise", state: "ID", type: "SNF", ownership: "Leased", beds: 98, ccn: "135090", overall: 3, health: 2, qm: 5, occ: 89, rn_hrs: 0.438, turnover: 56, rev: 15080000, net: 606000, ebitdar: 3750000, sff: false, status: "watch" },
  { fid: 128, name: "Silverton Health", city: "Silverton", state: "ID", type: "SNF", ownership: "Leased", beds: 50, ccn: "135058", overall: null, health: null, qm: null, occ: 94, rn_hrs: 0.548, turnover: 51, rev: 5800000, net: 451000, ebitdar: 2360000, sff: true, status: "urgent" },
  { fid: 129, name: "Silverton Retirement Living", city: "Silverton", state: "ID", type: "ILF", ownership: "Leased", beds: 21, ccn: "135058", overall: null, health: null, qm: null, occ: 77, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 145000, sff: true, status: "on_track" },
  { fid: 126, name: "Teton Healthcare", city: "Idaho Falls", state: "ID", type: "SNF", ownership: "Leased", beds: 78, ccn: "135138", overall: 1, health: 1, qm: 3, occ: 75, rn_hrs: 1.158, turnover: 48, rev: 11510000, net: 24000, ebitdar: 2040000, sff: true, status: "urgent" },
  { fid: 114, name: "The Cove", city: "Bellevue", state: "ID", type: "SNF", ownership: "Leased", beds: 32, ccn: "135069", overall: 4, health: 4, qm: 4, occ: 98, rn_hrs: 1.231, turnover: 38, rev: 6330000, net: 563000, ebitdar: 2260000, sff: false, status: "on_track" },
  { fid: 115, name: "The Cove ALF", city: "Bellevue", state: "ID", type: "ALF", ownership: "Leased", beds: 16, ccn: "135069", overall: null, health: null, qm: null, occ: 52, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 99000, sff: false, status: "watch" },
  { fid: 111, name: "The Orchards", city: "Nampa", state: "ID", type: "SNF", ownership: "Leased", beds: 92, ccn: "135019", overall: 1, health: 1, qm: 4, occ: 86, rn_hrs: 0.670, turnover: 50, rev: 12670000, net: -77000, ebitdar: 2120000, sff: true, status: "urgent" },
  { fid: 116, name: "Twin Falls Transitional", city: "Twin Falls", state: "ID", type: "SNF", ownership: "Leased", beds: 114, ccn: "135104", overall: 5, health: 4, qm: 5, occ: 45, rn_hrs: 0.626, turnover: 48, rev: 9320000, net: 492000, ebitdar: 2190000, sff: false, status: "watch" },
  { fid: 110, name: "Weiser Care", city: "Weiser", state: "ID", type: "SNF", ownership: "Leased", beds: 62, ccn: "135010", overall: 3, health: 3, qm: 4, occ: 69, rn_hrs: 0.750, turnover: 54, rev: 7240000, net: 95000, ebitdar: 1580000, sff: false, status: "on_track" },
  { fid: 104, name: "Wellspring", city: "Nampa", state: "ID", type: "SNF", ownership: "Leased", beds: 110, ccn: "135094", overall: 4, health: 3, qm: 5, occ: 68, rn_hrs: 0.722, turnover: 50, rev: 15200000, net: 301000, ebitdar: 2620000, sff: false, status: "on_track" },
  // WASHINGTON (14)
  { fid: 405, name: "Alderwood", city: "Bellingham", state: "WA", type: "SNF", ownership: "Leased", beds: 92, ccn: "505092", overall: 3, health: 2, qm: 5, occ: 73, rn_hrs: 0.932, turnover: 41, rev: 10490000, net: -297000, ebitdar: 1070000, sff: false, status: "on_track" },
  { fid: 401, name: "Brookfield", city: "Battle Ground", state: "WA", type: "SNF", ownership: "Leased", beds: 76, ccn: "505331", overall: 3, health: 3, qm: 4, occ: 77, rn_hrs: 1.002, turnover: 68, rev: 9790000, net: 627000, ebitdar: 1580000, sff: false, status: "on_track" },
  { fid: 402, name: "Clarkston Health", city: "Clarkston", state: "WA", type: "SNF", ownership: "Leased", beds: 87, ccn: "505283", overall: 4, health: 3, qm: 5, occ: 88, rn_hrs: 1.251, turnover: 32, rev: 11100000, net: 150000, ebitdar: 765000, sff: false, status: "on_track" },
  { fid: 404, name: "Colfax Health", city: "Colfax", state: "WA", type: "SNF", ownership: "Leased", beds: 55, ccn: "505251", overall: 1, health: 1, qm: 3, occ: 62, rn_hrs: 0.768, turnover: 77, rev: 6230000, net: -1350000, ebitdar: 351000, sff: false, status: "urgent" },
  { fid: 408, name: "Colville Health", city: "Colville", state: "WA", type: "SNF", ownership: "Leased", beds: 92, ccn: "505275", overall: 1, health: 1, qm: 3, occ: 60, rn_hrs: 0.664, turnover: 73, rev: 7760000, net: 16000, ebitdar: 760000, sff: true, status: "urgent" },
  { fid: 414, name: "Cypress Assisted Living", city: "Anacortes", state: "WA", type: "ALF", ownership: "New", beds: 44, ccn: null, overall: null, health: null, qm: null, occ: null, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: null, sff: false, status: "on_track" },
  { fid: 406, name: "Highland", city: "Bellingham", state: "WA", type: "SNF", ownership: "Leased", beds: 44, ccn: "505140", overall: 4, health: 4, qm: 4, occ: 81, rn_hrs: 1.441, turnover: 62, rev: 5060000, net: -457000, ebitdar: 173000, sff: false, status: "on_track" },
  { fid: 403, name: "Hudson Bay", city: "Vancouver", state: "WA", type: "SNF", ownership: "Leased", beds: 89, ccn: "505260", overall: 5, health: 4, qm: 5, occ: 82, rn_hrs: 1.014, turnover: 67, rev: 13220000, net: -523000, ebitdar: 869000, sff: false, status: "on_track" },
  { fid: 410, name: "Olympus Living of Spokane", city: "Spokane Valley", state: "WA", type: "ILF", ownership: "Leased", beds: 149, ccn: "505099", overall: null, health: null, qm: null, occ: 102, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 1230000, sff: false, status: "on_track" },
  { fid: 413, name: "Rosario Assisted Living", city: "Anacortes", state: "WA", type: "ALF", ownership: "New", beds: 84, ccn: null, overall: null, health: null, qm: null, occ: null, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: null, sff: false, status: "on_track" },
  { fid: 407, name: "Snohomish Health", city: "Snohomish", state: "WA", type: "SNF", ownership: "Leased", beds: 91, ccn: "505338", overall: 3, health: 2, qm: 5, occ: 73, rn_hrs: 1.031, turnover: 62, rev: 13150000, net: -359000, ebitdar: 350000, sff: false, status: "on_track" },
  { fid: 412, name: "Soundview Rehabilitation", city: "Anacortes", state: "WA", type: "SNF", ownership: "New", beds: 44, ccn: "505216", overall: 2, health: 2, qm: 3, occ: 73, rn_hrs: 0.737, turnover: 57, rev: 12190000, net: -3170000, ebitdar: null, sff: false, status: "on_track" },
  { fid: 409, name: "Spokane Valley", city: "Spokane Valley", state: "WA", type: "SNF", ownership: "Leased", beds: 97, ccn: "505099", overall: 2, health: 2, qm: 2, occ: 73, rn_hrs: 0.811, turnover: 66, rev: 5350000, net: 59000, ebitdar: 105000, sff: false, status: "watch" },
  { fid: 411, name: "Stafholt", city: "Blaine", state: "WA", type: "SNF", ownership: "Leased", beds: 57, ccn: "505395", overall: 5, health: 4, qm: 5, occ: 88, rn_hrs: 1.516, turnover: 53, rev: 3600000, net: -74000, ebitdar: 1580000, sff: false, status: "on_track" },
  // OREGON (8)
  { fid: 305, name: "Creekside", city: "Eugene", state: "OR", type: "SNF", ownership: "Leased", beds: 56, ccn: "385147", overall: 5, health: 5, qm: 5, occ: 87, rn_hrs: 0.659, turnover: 42, rev: 9070000, net: 316000, ebitdar: 1680000, sff: false, status: "on_track" },
  { fid: 306, name: "Creekside Retirement Living", city: "Eugene", state: "OR", type: "ILF", ownership: "Leased", beds: 63, ccn: "385147", overall: null, health: null, qm: null, occ: 106, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 436000, sff: false, status: "on_track" },
  { fid: 303, name: "Curry Village", city: "Brookings", state: "OR", type: "SNF", ownership: "Leased", beds: 59, ccn: "385165", overall: 2, health: 2, qm: 4, occ: 65, rn_hrs: 0.833, turnover: 50, rev: 4550000, net: -48000, ebitdar: 836000, sff: false, status: "watch" },
  { fid: 307, name: "Fairlawn", city: "Gresham", state: "OR", type: "SNF", ownership: "Leased", beds: 62, ccn: "385133", overall: 4, health: 4, qm: 3, occ: 92, rn_hrs: 0.798, turnover: 46, rev: 9430000, net: 656000, ebitdar: 2200000, sff: false, status: "on_track" },
  { fid: 308, name: "Fairlawn Retirement", city: "Gresham", state: "OR", type: "ILF", ownership: "Leased", beds: 119, ccn: "385133", overall: null, health: null, qm: null, occ: 94, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 1140000, sff: false, status: "on_track" },
  { fid: 304, name: "HillSide Apartments", city: "Brookings", state: "OR", type: "ILF", ownership: "Leased", beds: 13, ccn: "385165", overall: null, health: null, qm: null, occ: 87, rn_hrs: null, turnover: null, rev: null, net: null, ebitdar: 64000, sff: false, status: "on_track" },
  { fid: 301, name: "Secora Rehab", city: "Portland", state: "OR", type: "SNF", ownership: "Leased", beds: 53, ccn: "385010", overall: 3, health: 2, qm: 3, occ: 96, rn_hrs: 0.959, turnover: 40, rev: 27970000, net: null, ebitdar: 1840000, sff: false, status: "on_track" },
  { fid: 302, name: "Village Manor", city: "Wood Village", state: "OR", type: "SNF", ownership: "Leased", beds: 60, ccn: "38E174", overall: 4, health: 3, qm: 4, occ: 96, rn_hrs: 0.542, turnover: 35, rev: null, net: null, ebitdar: 2970000, sff: false, status: "watch" },
  // MONTANA (3)
  { fid: 201, name: "Libby Care", city: "Libby", state: "MT", type: "SNF", ownership: "Leased", beds: 89, ccn: "275040", overall: 3, health: 3, qm: 4, occ: 88, rn_hrs: 0.499, turnover: 27, rev: 12310000, net: 1220000, ebitdar: 3860000, sff: false, status: "watch" },
  { fid: 202, name: "Mount Ascension", city: "Helena", state: "MT", type: "SNF", ownership: "Leased", beds: 108, ccn: "275044", overall: 2, health: 2, qm: 2, occ: 55, rn_hrs: 0.625, turnover: 50, rev: 9120000, net: -52000, ebitdar: 66000, sff: false, status: "watch" },
  { fid: 203, name: "Mountain View", city: "Eureka", state: "MT", type: "SNF", ownership: "Leased", beds: 49, ccn: "275084", overall: 4, health: 4, qm: 3, occ: 74, rn_hrs: 1.107, turnover: 55, rev: 3690000, net: 145000, ebitdar: 891000, sff: false, status: "on_track" },
  // ARIZONA (2)
  { fid: 502, name: "Boswell", city: "Sun City", state: "AZ", type: "SNF", ownership: "Owned", beds: 115, ccn: "035121", overall: 5, health: 4, qm: 5, occ: 62, rn_hrs: 0.718, turnover: 49, rev: 13670000, net: -124000, ebitdar: 1800000, sff: false, status: "watch" },
  { fid: 501, name: "NorthPark", city: "Phoenix", state: "AZ", type: "SNF", ownership: "Owned", beds: 54, ccn: "035299", overall: 5, health: 5, qm: 5, occ: 88, rn_hrs: 0.844, turnover: 61, rev: 13430000, net: 36000, ebitdar: 1990000, sff: false, status: "on_track" },
];

async function seed() {
  console.log(`Seeding ${FACILITIES.length} Cascadia Healthcare facilities...`);

  for (const f of FACILITIES) {
    await db.query(
      `INSERT INTO buildings (name, type, address, city, state, zip, facility_id, ccn, beds,
        overall_rating, health_rating, qm_rating, occupancy_pct, rn_hours_per_day,
        turnover_pct, ownership, revenue_2023, net_income_2023, ebitdar_annual,
        special_focus, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        f.name, f.type, `${f.city}, ${f.state}`, f.city, f.state, "",
        f.fid, f.ccn, f.beds,
        f.overall, f.health, f.qm, f.occ, f.rn_hrs,
        f.turnover, f.ownership, f.rev, f.net, f.ebitdar,
        f.sff, f.status,
      ]
    );
    console.log(`  ✓ ${f.name} (${f.city}, ${f.state}) — ${f.type} — ${f.beds} beds`);
  }

  console.log(`\nDone! ${FACILITIES.length} facilities seeded.`);
  await db.end();
}

seed().catch(console.error);
