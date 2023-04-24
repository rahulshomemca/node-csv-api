const express = require('express')
const axios = require('axios')
const { Sequelize, DataTypes, Op  } = require('sequelize');
const csv = require('csv-parser')
const fs = require('fs')


const sequelize = new Sequelize({dialect: 'sqlite',
storage: './database.sqlite'})
const app = express()
const port = 3000


const User = sequelize.define('User', {
  // Model attributes are defined here
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timestamps: false,

  // If don't want createdAt
  createdAt: false,

  // If don't want updatedAt
  updatedAt: false,
}, {
  // Other model options go here
});

sequelize.sync()  

app.get('/',async (req, res) => {
  const response = await axios.get('https://jsonplaceholder.typicode.com/comments')
  const data = response.data;

  data.forEach(async(comment) => {
    sequelize.query(`insert into Users (name, email, body) values ('${comment.name}', '${comment.email}', '${comment.body}');`)
  })

  const results = []

  fs.createReadStream('csvdata.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results);
    results.forEach(async(comment) => {
      sequelize.query(`insert into Users (name, email, body) values ('${comment.name}', '${comment.email}', '${comment.body}');`)
    })
  });

  res.json({
    "msg": "data loaded"
  }).status(200)
})

app.get('/search',async (req, res) => {

  let condition = {}

  if(req.query.name){
    condition.name = {
      [Op.like]: `%${req.query.name}%`
    }
  }

  if(req.query.body){
    condition.body = {
      [Op.like]: `%${req.query.body}%`
    }
  }

  if(req.query.email){
    condition.email = {
      [Op.like]: `%${req.query.email}%`
    }
  }

  const limit = req.query.limit || 10
  const sortKey = req.query.sortKey || "name";
  const sortOrder = req.query.sortOrder || "ASC";

  console.log(condition)
  
  let data = await User.findAll({
    where: condition, 
    limit: limit, 
    order: [
      [sortKey, sortOrder]
    ],
    attributes: ['name', 'body', 'email']
  })

 
  res.json({comments: data}).status
})

app.listen(port,async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  console.log(`Example app listening on port ${port}`)
})