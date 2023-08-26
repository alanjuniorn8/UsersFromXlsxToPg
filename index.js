const pg = require('postgres')
const xlsx = require('xlsx')
const bcrypt = require("bcrypt");

require('dotenv').config()

const sql = pg({
  host: process.env.HOST,
  port : process.env.PORT,
  database: process.env.DATABASE,
  username: process.env.USERNAME,
  password: process.env.PASSWORD
})

const insertData = async (
  name,
  email, 
  city,
  country,
  password
) => {

  const alreadyUser = await sql`
    select
      email
    from 
      "Accounts"
    where
      email = ${ email }
  `

  if (alreadyUser.length > 0) return;

  await sql`
    insert into "Accounts"
      (
        name,
        email, 
        city,
        country,
        provider,
        "passwordHash",
        "createdAt",
        "updatedAt"
      )
    values
      (
        ${ name }, 
        ${ email },
        ${ city },
        ${ country },
        ${true},
        ${await bcrypt.hash(password, 10)},
        ${new Date()},
        ${new Date()}
      )
    `
}

const readDataAndInsert = async () => {

  let workbook = xlsx.readFile(process.env.SHEET)
  let worksheet = workbook.Sheets[workbook.SheetNames[0]]
  let range = xlsx.utils.decode_range(worksheet['!ref'])

  try {
    for(let row = range.s.r; row <= range.e.r; row++){
      let data = []
  
      for(let col = range.s.c; col <= range.e.c; col++) {
        let cell = worksheet[xlsx.utils.encode_cell({
          r: row,
          c: col
        })]
        data.push(cell.v)
      }
  
      await insertData(
        data[0],
        data[1],
        data[2],
        data[3],
        data[4]
      );
    }
  } catch (e){
    console.log(e)
  } finally {
    sql.end();
    process.exit();
  }
}

readDataAndInsert();

