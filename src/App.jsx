// Smart Kitchen App v2.1 - April 26 2026
import React, { useState, useRef, useEffect } from "react";

// -- Design tokens -------------------------------------------------------------
const C={
  bg:"#0c0e14",surface:"#13161f",card:"#1a1e2b",cardHover:"#1f2436",
  border:"#252c3f",borderLight:"#2e3650",
  accent:"#f0a500",green:"#3ecf8e",red:"#f06060",
  blue:"#5b9cf6",purple:"#a78bfa",teal:"#2dd4bf",orange:"#fb923c",
  text:"#eceaf3",muted:"#6b728e",dim:"#3a4060",
};
const FD="'Cormorant Garamond', serif";
const FB="'DM Sans', sans-serif";
const FM="'JetBrains Mono', monospace";

// -- Constants -----------------------------------------------------------------
const LOCATIONS=["Pantry","Fridge","Freezer"];
const LOC_ICONS={Pantry:"🗄",Fridge:"❄️",Freezer:"🧊"};
const LOC_COLORS={Pantry:C.accent,Fridge:C.blue,Freezer:C.purple};
const CATEGORIES=["Protein","Produce","Dairy","Pantry","Grains","Spices","Frozen","Condiments","Other"];
const CAT_COLORS={Protein:C.red,Produce:C.green,Dairy:C.blue,Pantry:C.accent,Grains:"#c9a96e",Spices:C.purple,Frozen:"#6be3f0",Condiments:"#94a3b8",Other:C.muted};
const PROTEIN_TAG_COLOR=(name)=>{
  if(!name) return C.muted;
  const n=name.toLowerCase();
  if(n.includes("chicken")) return C.blue;
  if(n.includes("beef")||n.includes("burger")||n.includes("ground")) return C.red;
  if(n.includes("pork")||n.includes("chop")||n.includes("rib")) return C.orange;
  if(n.includes("kielbasa")||n.includes("sausage")) return C.purple;
  return C.accent;
};

// -- Dietary restriction presets -----------------------------------------------
const RESTRICTION_PRESETS={
  none:         {label:"No Restrictions",   color:C.green,   icon:"✅", flags:[]},
  standard:     {label:"Standard Adult",    color:C.muted,   icon:"👤", flags:[]},
  athlete:      {label:"Teen Athlete",      color:C.green,   icon:"🏃", flags:["high-protein","high-calorie"]},
  senior:       {label:"Senior Adult",      color:C.teal,    icon:"👴", flags:["low-sodium"]},
  diabetic:     {label:"Diabetic (Strict)", color:C.blue,    icon:"💉", flags:["zero-sugar","no-white-rice","no-regular-pasta","whole-wheat-only","brown-rice-only","low-carb"]},
  renal:        {label:"Renal/Kidney",      color:C.purple,  icon:"🫘", flags:["low-potassium","low-phosphorus","low-sodium","limit-protein"]},
  diabeticRenal:{label:"Diabetic+Renal",    color:"#f472b6", icon:"⚕️", flags:["zero-sugar","no-white-rice","no-regular-pasta","whole-wheat-only","brown-rice-only","low-carb","low-potassium","low-phosphorus","low-sodium","limit-protein"]},
  heartHealthy: {label:"Heart-Healthy",     color:C.red,     icon:"❤️", flags:["low-sodium","low-saturated-fat"]},
  lowSodium:    {label:"Low Sodium",        color:C.orange,  icon:"🧂", flags:["low-sodium"]},
};

const ROLE_LABELS={adult:"Adult","teen-athlete":"Teen Athlete",child:"Child",senior:"Senior"};

const DEFAULT_PROFILES=[
  {id:1,name:"",role:"adult",       restriction:"standard", customParams:{},active:true },
  {id:2,name:"",role:"adult",       restriction:"standard", customParams:{},active:true },
  {id:3,name:"",role:"adult",       restriction:"standard", customParams:{},active:true },
  {id:4,name:"",role:"teen-athlete",restriction:"athlete",  customParams:{},active:false},
  {id:5,name:"",role:"teen-athlete",restriction:"athlete",  customParams:{},active:false},
  {id:6,name:"",role:"teen-athlete",restriction:"athlete",  customParams:{},active:false},
];

// -- Inventory -----------------------------------------------------------------
// Rick's personal inventory
const YOUR_INVENTORY=[
  // Freezer - portioned proteins
  {id:51,name:"Chicken Breast",  qty:9, unit:"portions",category:"Protein",location:"Freezer",isBulkProtein:true,portionOz:6},
  {id:52,name:"Chicken Thighs",  qty:12,unit:"portions",category:"Protein",location:"Freezer",isBulkProtein:true,portionOz:5},
  {id:53,name:"Pork Chops",      qty:6, unit:"portions",category:"Protein",location:"Freezer",isBulkProtein:true,portionOz:6},
  {id:54,name:"Burger Patties",  qty:10,unit:"patties", category:"Protein",location:"Freezer"},
  {id:55,name:"Ground Beef",     qty:3, unit:"1.5lb pkgs",category:"Protein",location:"Freezer"},
  {id:56,name:"Kielbasa",        qty:2, unit:"packages",category:"Protein",location:"Freezer"},
  {id:57,name:"Pork Spareribs",  qty:1, unit:"rack",    category:"Protein",location:"Freezer"},
  {id:58,name:"Bacon",           qty:1, unit:"1.5lb pkg",category:"Protein",location:"Freezer"},
  // Freezer - prepped veg
  {id:4, name:"Mixed Sauté Blend",qty:9,unit:"2-cup bags",category:"Produce",location:"Freezer",isDicedVeg:true,vegType:"sauteBlend",cupsPerBag:2,blendNote:"Diced onion + celery + bell pepper"},
  // Freezer - commercial
  {id:5, name:"Frozen Corn",     qty:1, unit:"16oz bag", category:"Frozen",location:"Freezer"},
  {id:6, name:"Frozen Peas",     qty:1, unit:"16oz bag", category:"Frozen",location:"Freezer"},
  {id:61,name:"Frozen Mixed Veg",qty:1, unit:"bag",      category:"Frozen",location:"Freezer"},
  {id:62,name:"Frozen Broccoli", qty:3, unit:"meal bags",category:"Frozen",location:"Freezer"},
  {id:59,name:"Stouffer's Chipped Beef",qty:3,unit:"boxes",category:"Frozen",location:"Freezer",note:"Sue's lunches — not for dinner planning"},
  {id:60,name:"Seasoned Fries",  qty:2, unit:"bags",     category:"Frozen",location:"Freezer"},
  // Fridge - dairy
  {id:63,name:"Eggs",            qty:24,unit:"count",    category:"Dairy",location:"Fridge"},
  {id:64,name:"Butter",          qty:5, unit:"sticks",   category:"Dairy", location:"Fridge"},
  {id:65,name:"Cream Cheese",    qty:3, unit:"8oz blocks",category:"Dairy",location:"Fridge"},
  {id:66,name:"Greek Yogurt",    qty:1, unit:"32oz tub", category:"Dairy", location:"Fridge"},
  {id:67,name:"Milk",            qty:1, unit:"gallon",   category:"Dairy", location:"Fridge"},
  {id:68,name:"Coffee Creamer",  qty:1, unit:"bottle",   category:"Dairy", location:"Fridge"},
  {id:69,name:"Sour Cream",      qty:1, unit:"tub",      category:"Dairy", location:"Fridge"},
  {id:70,name:"Italian 6 Cheese",qty:1, unit:"2lb bag",  category:"Dairy", location:"Fridge"},
  {id:71,name:"Mexican 4 Cheese",qty:1, unit:"2lb bag",  category:"Dairy", location:"Fridge"},
  {id:72,name:"Shredded Parmesan",qty:1,unit:"6oz bag",  category:"Dairy", location:"Fridge"},
  {id:73,name:"American Cheese", qty:16,unit:"slices",   category:"Dairy", location:"Fridge"},
  {id:74,name:"Swiss Cheese",    qty:1, unit:"deli pack", category:"Dairy",location:"Fridge"},
  {id:75,name:"Velveeta",        qty:4, unit:"oz",        category:"Dairy",location:"Fridge",isLow:true},
  // Fridge - deli & produce
  {id:76,name:"Smoked Ham",      qty:0.5,unit:"lb",      category:"Protein",location:"Fridge"},
  {id:77,name:"Pepperoni",       qty:1, unit:"stick",    category:"Protein",location:"Fridge"},
  {id:78,name:"Apples",          qty:1, unit:"bag",      category:"Produce",location:"Fridge"},
  {id:79,name:"Lettuce",         qty:1, unit:"bag",      category:"Produce",location:"Fridge"},
  // Fridge - condiments
  {id:20,name:"Ketchup",         qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:21,name:"Miracle Whip",    qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:23,name:"Dill Relish",     qty:2,unit:"jars",      category:"Condiments",location:"Fridge",isCondiment:true},
  {id:24,name:"Sweet Relish",    qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:25,name:"BTB Chili Base",  qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:26,name:"BTB Beef Base",   qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:27,name:"BTB Chicken Base",qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:28,name:"Lemon Juice",     qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:30,name:"Minced Garlic",   qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:31,name:"Cocktail Sauce",  qty:2,unit:"bottles",   category:"Condiments",location:"Fridge",isCondiment:true},
  {id:32,name:"Grape Jelly",     qty:2,unit:"jars",      category:"Condiments",location:"Fridge",isCondiment:true},
  {id:33,name:"Black Bean Salsa",qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:34,name:"Kosher Dill Pickles",qty:1,unit:"jar",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:35,name:"Horseradish",     qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:36,name:"Taco Sauce",      qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:37,name:"Sweet Baby Ray's BBQ",qty:2,unit:"bottles",category:"Condiments",location:"Fridge",isCondiment:true},
  {id:38,name:"Western Dressing",qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:39,name:"SBR Garlic Parmesan",qty:1,unit:"bottle", category:"Condiments",location:"Fridge",isCondiment:true},
  {id:40,name:"Mayonnaise",      qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:41,name:"Soy Sauce",       qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:42,name:"Sweet Chili Sauce",qty:1,unit:"bottle",   category:"Condiments",location:"Fridge",isCondiment:true},
  {id:43,name:"Yellow Mustard",  qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:44,name:"Habanero Ketchup",qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:45,name:"Ranch Dressing",  qty:2,unit:"bottles",   category:"Condiments",location:"Fridge",isCondiment:true},
  {id:46,name:"Worcestershire",  qty:1,unit:"bottle",    category:"Condiments",location:"Fridge",isCondiment:true},
  {id:47,name:"Poppy Seed Dressing",qty:1,unit:"bottle", category:"Condiments",location:"Fridge",isCondiment:true},
  {id:80,name:"Chi-Chi's Salsa", qty:1,unit:"jar",       category:"Condiments",location:"Fridge",isCondiment:true},
  {id:81,name:"Strawberry Preserves",qty:1,unit:"jar",   category:"Condiments",location:"Fridge",isCondiment:true},
  {id:82,name:"Cinnamon Applesauce",qty:1,unit:"jar",    category:"Condiments",location:"Fridge",isCondiment:true},
  // Fridge - baking & dough
  {id:83,name:"Puff Pastry",     qty:3,unit:"packages",  category:"Pantry", location:"Fridge"},
  {id:84,name:"Pie Crusts",      qty:2,unit:"boxes",     category:"Pantry", location:"Fridge"},
  {id:85,name:"Crescent Dough",  qty:3,unit:"cans",      category:"Pantry", location:"Fridge"},
  // Pantry - oils & staples
  {id:86,name:"Olive Oil (Mild)",qty:1,unit:"bottle",    category:"Pantry", location:"Pantry"},
  {id:87,name:"Extra Virgin Olive Oil",qty:1,unit:"bottle",category:"Pantry",location:"Pantry"},
  {id:88,name:"Vegetable Oil",   qty:1,unit:"bottle",    category:"Pantry", location:"Pantry"},
  {id:89,name:"Maple Syrup",     qty:1,unit:"bottle",    category:"Pantry", location:"Pantry",isLow:true},
  {id:90,name:"Russet Potatoes", qty:4,unit:"large",     category:"Produce",location:"Pantry"},
  // Pantry - spices
  {id:91,name:"Dry Mustard",     qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:92,name:"Cream of Tartar", qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:93,name:"Granulated Garlic",qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:94,name:"Granulated Onion",qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:95,name:"Celery Seed",     qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:96,name:"Ranch Seasoning", qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:97,name:"Italian Seasoning",qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:98,name:"Lawry's Seasoned Salt",qty:2,unit:"containers",category:"Spices",location:"Pantry"},
  {id:99,name:"Corn Starch",     qty:1,unit:"container", category:"Pantry",location:"Pantry"},
  {id:100,name:"Baking Soda",    qty:2,unit:"boxes",     category:"Pantry",location:"Pantry"},
  {id:101,name:"Baking Powder",  qty:2,unit:"containers",category:"Pantry",location:"Pantry"},
  {id:102,name:"Iodized Salt",   qty:1,unit:"container", category:"Pantry",location:"Pantry"},
  {id:103,name:"Ground Cloves",  qty:1,unit:"jar",       category:"Spices",location:"Pantry"},
  {id:104,name:"Cinnamon",       qty:1,unit:"jar",       category:"Spices",location:"Pantry"},
  {id:105,name:"Coarse Sea Salt",qty:1,unit:"container", category:"Spices",location:"Pantry"},
  {id:106,name:"Vanilla Extract",qty:1,unit:"bottle",    category:"Pantry",location:"Pantry"},
  {id:107,name:"Paprika",        qty:1,unit:"jar",       category:"Spices",location:"Pantry"},
  {id:108,name:"Bread Crumbs",   qty:1,unit:"container", category:"Pantry",location:"Pantry"},
  {id:109,name:"Ranch Mix Packet",qty:1,unit:"packet",   category:"Pantry",location:"Pantry"},
  {id:110,name:"Taco Seasoning", qty:2,unit:"packets",   category:"Pantry",location:"Pantry"},
  // Pantry - staples
  {id:111,name:"Peanut Butter",  qty:1,unit:"jar",       category:"Pantry",location:"Pantry"},
  {id:112,name:"Cream of Wheat", qty:1,unit:"box",       category:"Grains",location:"Pantry"},
  {id:113,name:"Raisins",        qty:1,unit:"2lb bag",   category:"Pantry",location:"Pantry"},
  {id:114,name:"Flour Tortillas",qty:12,unit:"count",    category:"Pantry",location:"Pantry"},
  {id:115,name:"White Bread",    qty:1,unit:"loaf",      category:"Pantry",location:"Pantry"},
  {id:116,name:"Angel Hair Pasta",qty:2,unit:"boxes",    category:"Grains",location:"Pantry"},
  {id:117,name:"Elbow Macaroni", qty:2,unit:"boxes",     category:"Grains",location:"Pantry"},
  {id:118,name:"Creamette Pasta",qty:1,unit:"box",       category:"Grains",location:"Pantry"},
  {id:119,name:"Wide Egg Noodles",qty:1,unit:"bag",      category:"Grains",location:"Pantry"},
  {id:120,name:"Quick Oats",     qty:1,unit:"canister",  category:"Grains",location:"Pantry"},
  {id:121,name:"Steel Cut Oats", qty:1,unit:"canister",  category:"Grains",location:"Pantry"},
  {id:122,name:"Grits",          qty:1,unit:"canister",  category:"Grains",location:"Pantry"},
  {id:123,name:"Kraft Mac & Cheese",qty:2,unit:"boxes",  category:"Pantry",location:"Pantry"},
  {id:124,name:"Deluxe Mac & Cheese",qty:4,unit:"boxes", category:"Pantry",location:"Pantry"},
  {id:125,name:"Suddenly Pasta Salad",qty:1,unit:"twin pack",category:"Pantry",location:"Pantry"},
  {id:126,name:"Maruchan Instant Lunch",qty:4,unit:"cups",category:"Pantry",location:"Pantry"},
  // Pantry - canned goods
  {id:127,name:"Prego 4 Cheese Sauce",qty:1,unit:"jar",  category:"Pantry",location:"Pantry"},
  {id:128,name:"Spicy Refried Beans",qty:1,unit:"can",   category:"Pantry",location:"Pantry"},
  {id:129,name:"Cherry Pie Filling",qty:1,unit:"can",    category:"Pantry",location:"Pantry"},
  {id:130,name:"Tuna",           qty:1,unit:"can",       category:"Protein",location:"Pantry"},
  {id:131,name:"Campbell's Chicken Noodle",qty:1,unit:"can",category:"Pantry",location:"Pantry"},
  {id:132,name:"Campbell's Tomato Soup",qty:4,unit:"cans",category:"Pantry",location:"Pantry"},
  {id:133,name:"Campbell's Cream of Chicken",qty:3,unit:"cans",category:"Pantry",location:"Pantry"},
  {id:134,name:"Frank's RedHot",qty:1,unit:"bottle",     category:"Condiments",location:"Pantry",isCondiment:true},
  {id:135,name:"Molasses",       qty:1,unit:"bottle",    category:"Pantry",location:"Pantry"},
  {id:136,name:"Dark Corn Syrup",qty:1,unit:"bottle",    category:"Pantry",location:"Pantry"},
  {id:137,name:"Jiffy Corn Muffin Mix",qty:1,unit:"box", category:"Pantry",location:"Pantry"},
  {id:138,name:"Cranberry Orange Muffin Mix",qty:1,unit:"box",category:"Pantry",location:"Pantry"},
  {id:139,name:"Wild Blueberry Muffin Mix",qty:1,unit:"box",category:"Pantry",location:"Pantry"},
  {id:140,name:"Banana Nut Muffin Mix",qty:1,unit:"box", category:"Pantry",location:"Pantry"},
  {id:141,name:"Chocolate Fudge Brownie Mix",qty:1,unit:"box",category:"Pantry",location:"Pantry"},
  {id:142,name:"Ghirardelli Peppermint Brownie Mix",qty:2,unit:"boxes",category:"Pantry",location:"Pantry"},
  {id:143,name:"Sparkling Ice",  qty:1,unit:"12-pack",   category:"Pantry",location:"Pantry"},
  {id:144,name:"BBQ Sauce (pantry)",qty:1,unit:"bottle", category:"Condiments",location:"Pantry",isCondiment:true},
  {id:145,name:"Sweetened Condensed Milk",qty:2,unit:"cans",category:"Pantry",location:"Pantry"},
  {id:146,name:"Apple Pie Filling",qty:1,unit:"can",     category:"Pantry",location:"Pantry"},
  {id:147,name:"Pineapple Slices",qty:1,unit:"can",      category:"Pantry",location:"Pantry"},
  {id:148,name:"Portabella Mushrooms",qty:2,unit:"cans", category:"Pantry",location:"Pantry"},
  {id:149,name:"Refried Beans",  qty:1,unit:"can",       category:"Pantry",location:"Pantry"},
  {id:150,name:"Campbell's Homestyle Chicken Noodle",qty:1,unit:"can",category:"Pantry",location:"Pantry"},
  {id:151,name:"Sauerkraut",     qty:1,unit:"32oz jar",  category:"Pantry",location:"Pantry"},
  {id:152,name:"Brooks Chili Hot Beans",qty:1,unit:"can",category:"Pantry",location:"Pantry"},
  {id:153,name:"Prego Roasted Garlic Sauce",qty:1,unit:"jar",category:"Pantry",location:"Pantry"},
  {id:154,name:"Pizza Sauce",    qty:1,unit:"jar",       category:"Pantry",location:"Pantry"},
  {id:155,name:"Tomato Sauce",   qty:2,unit:"cans",      category:"Pantry",location:"Pantry"},
  {id:156,name:"Petite Diced Tomatoes",qty:2,unit:"cans",category:"Pantry",location:"Pantry"},
  {id:157,name:"Panko Bread Crumbs",qty:1,unit:"canister",category:"Pantry",location:"Pantry"},
  {id:158,name:"Manwich Sloppy Joe",qty:2,unit:"cans",   category:"Pantry",location:"Pantry"},
  {id:159,name:"Chef Boyardee Mini Ravioli",qty:1,unit:"can",category:"Pantry",location:"Pantry"},
  {id:160,name:"Tang Orange Drink Mix",qty:2,unit:"canisters",category:"Pantry",location:"Pantry"},
  {id:161,name:"Crisco Shortening",qty:1,unit:"can",     category:"Pantry",location:"Pantry"},
  {id:162,name:"Hidden Valley Ranch (pantry)",qty:1,unit:"bottle",category:"Condiments",location:"Pantry",isCondiment:true},
  {id:163,name:"Minute Brown Rice",qty:2,unit:"28oz boxes",category:"Grains",location:"Pantry"},
  {id:164,name:"Minute White Rice",qty:2,unit:"28oz boxes",category:"Grains",location:"Pantry"},
  {id:165,name:"All-Purpose Flour",qty:2,unit:"bags",    category:"Pantry",location:"Pantry"},
  {id:166,name:"Granulated Sugar",qty:1,unit:"bag",      category:"Pantry",location:"Pantry"},
  {id:167,name:"Powdered Sugar",  qty:1,unit:"bag",      category:"Pantry",location:"Pantry"},
  {id:168,name:"Chicken Broth",   qty:2,unit:"cans",     category:"Pantry",location:"Pantry"},
  {id:169,name:"Diced Tomatoes",  qty:2,unit:"cans",     category:"Pantry",location:"Pantry"},
];

const INITIAL_INVENTORY=[];

// Common pantry staples for new user setup
const COMMON_PANTRY=[
  {id:801,name:"Olive Oil",qty:1,unit:"bottle",category:"Pantry",location:"Pantry"},
  {id:802,name:"Vegetable Oil",qty:1,unit:"bottle",category:"Pantry",location:"Pantry"},
  {id:803,name:"All-Purpose Flour",qty:1,unit:"bag",category:"Pantry",location:"Pantry"},
  {id:804,name:"Granulated Sugar",qty:1,unit:"bag",category:"Pantry",location:"Pantry"},
  {id:805,name:"Salt",qty:1,unit:"container",category:"Spices",location:"Pantry"},
  {id:806,name:"Black Pepper",qty:1,unit:"container",category:"Spices",location:"Pantry"},
  {id:807,name:"Garlic Powder",qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:808,name:"Onion Powder",qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:809,name:"Italian Seasoning",qty:1,unit:"jar",category:"Spices",location:"Pantry"},
  {id:810,name:"Taco Seasoning",qty:1,unit:"packet",category:"Spices",location:"Pantry"},
  {id:811,name:"Cream of Chicken Soup",qty:2,unit:"cans",category:"Pantry",location:"Pantry"},
  {id:812,name:"Tomato Sauce",qty:2,unit:"cans",category:"Pantry",location:"Pantry"},
  {id:813,name:"Chicken Broth",qty:2,unit:"cans",category:"Pantry",location:"Pantry"},
  {id:814,name:"Soy Sauce",qty:1,unit:"bottle",category:"Condiments",location:"Fridge"},
  {id:815,name:"Ketchup",qty:1,unit:"bottle",category:"Condiments",location:"Fridge"},
  {id:816,name:"Mayonnaise",qty:1,unit:"jar",category:"Condiments",location:"Fridge"},
  {id:817,name:"Butter",qty:1,unit:"box",category:"Dairy",location:"Fridge"},
  {id:818,name:"Eggs",qty:12,unit:"count",category:"Dairy",location:"Fridge"},
  {id:819,name:"White Rice",qty:1,unit:"bag",category:"Grains",location:"Pantry"},
  {id:820,name:"Pasta",qty:2,unit:"boxes",category:"Grains",location:"Pantry"},
  {id:821,name:"Egg Noodles",qty:1,unit:"bag",category:"Grains",location:"Pantry"},
  {id:822,name:"Bread",qty:1,unit:"loaf",category:"Pantry",location:"Pantry"},
  {id:823,name:"Frozen Corn",qty:1,unit:"bag",category:"Frozen",location:"Freezer"},
  {id:824,name:"Frozen Broccoli",qty:1,unit:"bag",category:"Frozen",location:"Freezer"},
  {id:825,name:"Frozen Peas",qty:1,unit:"bag",category:"Frozen",location:"Freezer"},
];

// -- UI helpers ----------------------------------------------------------------
const bBtn=(v="primary",ex={})=>({
  padding:"9px 20px",borderRadius:9,border:"none",cursor:"pointer",
  fontFamily:FM,fontSize:12,fontWeight:600,letterSpacing:0.6,transition:"all 0.17s",
  background:v==="primary"?C.accent:v==="danger"?C.red:v==="green"?C.green:v==="teal"?C.teal:v==="orange"?C.orange:v==="ghost"?"transparent":C.card,
  color:(v==="primary"||v==="green"||v==="teal"||v==="orange")?"#0c0e14":v==="ghost"?C.muted:C.text,
  border:v==="ghost"?"1px solid "+C.border:"none",...ex,
});
const bTag=(color=C.accent)=>({
  display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",
  borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:0.9,
  background:color+"22",color,border:"1px solid "+color+"44",
});
const bInp={background:"#1f2436",border:"1px solid "+C.border,borderRadius:8,padding:"9px 13px",color:C.text,fontFamily:FM,fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"};
const Label=({children})=><div style={{fontSize:10,color:C.muted,fontFamily:FM,letterSpacing:0.8,marginBottom:5}}>{children}</div>;

// -- Claude API ----------------------------------------------------------------
async function callClaude({system,prompt,imageBase64,imageType,maxTokens=1800}){
  const content=[];
  if(imageBase64) content.push({type:"image",source:{type:"base64",media_type:imageType||"image/jpeg",data:imageBase64}});
  content.push({type:"text",text:prompt});
  const apiKey=import.meta.env?.VITE_ANTHROPIC_API_KEY||"";
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:maxTokens,system,messages:[{role:"user",content}]}),
    signal:AbortSignal.timeout(25000),
  });
  if(!res.ok) throw new Error("API error "+res.status);
  const data=await res.json();
  if(data.error) throw new Error(data.error.message||"API error");
  return(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
}

function fileToBase64(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});}

// -- Loading dots --------------------------------------------------------------
function LoadingDots(){
  const [tick,setTick]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setTick(n=>n+1),400);return()=>clearInterval(t);},[]);
  return <span style={{fontFamily:"monospace",color:C.accent,fontSize:18,letterSpacing:2}}>{"...".slice(0,(tick%3)+1).padEnd(3,"\u00a0")}</span>;
}

// =============================================================================
export default function SmartKitchen(){
  // -- State ------------------------------------------------------------------
  const [tab,setTab]=useState("inventory");
  const loadLocal=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};const [inventory,setInventory]=useState(()=>loadLocal("sk_inventory",INITIAL_INVENTORY));
  const [recipes,setRecipes]=useState([]);
  const [recipeError,setRecipeError]=useState("");
  const [mealPlan,setMealPlan]=useState(()=>loadLocal("sk_mealPlan",[]));
  const [sportsNights,setSportsNights]=useState(()=>loadLocal('sk_sportsNights',[]));
  const [shopping,setShopping]=useState([]);
  const [restockQueue,setRestockQueue]=useState(()=>{try{return JSON.parse(localStorage.getItem("sk_restockQueue")||"[]")}catch{return []}});
  const [shopPartnerName,setShopPartnerName]=useState(()=>localStorage.getItem("sk_shopPartnerName")||"");
  const [shopPartnerEmail,setShopPartnerEmail]=useState(()=>localStorage.getItem("sk_shopPartnerEmail")||"");
  const [desserts,setDesserts]=useState([]);
  const [activeDessert,setActiveDessert]=useState(null);
  const [dessertLoading,setDessertLoading]=useState(false);
  const [dessertError,setDessertError]=useState("");
  const [loading,setLoading]=useState(false);
  const [loadMsg,setLoadMsg]=useState("");
  const [filterCat,setFilterCat]=useState("All");
  const [filterLoc,setFilterLoc]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const [newItem,setNewItem]=useState({name:"",qty:"",unit:"",category:"Pantry",location:"Pantry"});
  const [activeRecipe,setActiveRecipe]=useState(null);
  const [familySize,setFamilySize]=useState(()=>loadLocal("sk_familySize",3));
  const [familyProfiles,setFamilyProfiles]=useState(()=>loadLocal("sk_familyProfiles",DEFAULT_PROFILES));
  const [tempProfiles,setTempProfiles]=useState(()=>loadLocal("sk_tempProfiles",[]));
  const [seniorMode,setSeniorMode]=useState(()=>{try{return localStorage.getItem("sk_seniorMode")==="1";}catch{return false;}});
  const [showTempForm,setShowTempForm]=useState(false);
  const [newTemp,setNewTemp]=useState({name:"",reason:"",restriction:"lowSodium",customNotes:"",startDate:new Date().toISOString().split("T")[0],endDate:"",duration:7});
  const [profileModalOpen,setProfileModalOpen]=useState(false);
  const [recipeSite,setRecipeSite]=useState(()=>loadLocal("sk_recipeSite","google"));
  const [showSettings,setShowSettings]=useState(false);
  const [showWizard,setShowWizard]=useState(()=>{try{return localStorage.getItem("sk_setupDone")!=="1"&&loadLocal("sk_inventory",[]).length===0;}catch{return false;}});
  const [wizardStep,setWizardStep]=useState(-2);
  const [wizardProteins,setWizardProteins]=useState([]);
  const [wizardProteinInput,setWizardProteinInput]=useState({name:"",qty:"",oz:"6"});
  const [pantryChecklist,setPantryChecklist]=useState(()=>COMMON_PANTRY.map(i=>({...i,checked:false})));
  const [showInstallBanner,setShowInstallBanner]=useState(()=>{try{return localStorage.getItem("sk_installDismissed")!=="1";}catch{return true;}});
  const [showInventoryReminder,setShowInventoryReminder]=useState(()=>{
    try{
      const day=new Date().getDay(); // 0=Sun, 3=Wed
      if(day!==0&&day!==3) return false;
      const dismissed=localStorage.getItem("sk_reminderDismissed");
      if(!dismissed) return true;
      const lastDismissed=new Date(dismissed);
      const today=new Date();
      today.setHours(0,0,0,0);
      lastDismissed.setHours(0,0,0,0);
      return lastDismissed.getTime()<today.getTime();
    }catch{return false;}
  });
  const dismissReminder=()=>{try{localStorage.setItem("sk_reminderDismissed",new Date().toISOString());}catch{}setShowInventoryReminder(false);};
  const dismissInstall=()=>{setShowInstallBanner(false);try{localStorage.setItem("sk_installDismissed","1");}catch{}};
  const [editingProfile,setEditingProfile]=useState(null);
  const [printModal,setPrintModal]=useState(null);
  const [scanOpen,setScanOpen]=useState(false);
  const [scanLoc,setScanLoc]=useState("");
  const [scanShelf,setScanShelf]=useState("");
  const [scanPreview,setScanPreview]=useState(null);
  const [scanB64,setScanB64]=useState(null);
  const [scanMime,setScanMime]=useState("image/jpeg");
  const [scanResults,setScanResults]=useState(null);const [changeMealModal,setChangeMealModal]=useState(null);const [expandedDay,setExpandedDay]=useState(null);const [changeMealRequest,setChangeMealRequest]=useState("");const [changeMealLoading,setChangeMealLoading]=useState(false);
  const [scanStage,setScanStage]=useState("upload");
  const [scanMode,setScanMode]=useState("shelf");
  const [saleItems,setSaleItems]=useState(()=>{try{return JSON.parse(localStorage.getItem("sk_saleItems")||"[]");}catch{return [];}});
  const [rpOpen,setRpOpen]=useState(false);
  const [rpMode,setRpMode]=useState("protein");
  const [rpPName,setRpPName]=useState("");
  const [rpPLbs,setRpPLbs]=useState("");
  const [rpPOz,setRpPOz]=useState(6);
  const [rpPPreview,setRpPPreview]=useState(null);
  const [rpVSessions,setRpVSessions]=useState([{id:1,preset:{name:"Mixed Sauté Blend",cupsPerUnit:3,bagCups:2,color:C.orange},count:"",bags:null}]);
  const fileRef=useRef();
  const galleryRef=useRef();
  // Migration: promote Protein items + fix corrupted portion counts > 50
  useEffect(()=>{
    const fixed=localStorage.getItem("sk_portionFixV2");
    setInventory(prev=>{
      const skipUnits=["lb","oz","g","kg","can","jar","bottle","stick","bunch","gallon","slice","slices"];
      const isBulkCandidate=i=>i.category==="Protein"&&!i.isBulkProtein&&(i.location==="Freezer"||!i.location)&&!skipUnits.includes((i.unit||"").toLowerCase())&&(parseFloat(i.qty)||0)<=50;
      const hasCorrupted=!fixed&&prev.some(i=>i.isBulkProtein&&(parseFloat(i.qty)||0)>50);
      const needsPromo=prev.some(isBulkCandidate);
      if(!needsPromo&&!hasCorrupted)return prev;
      if(hasCorrupted)localStorage.setItem("sk_portionFixV2","1");
      return prev.map(i=>{
        if(isBulkCandidate(i))return{...i,isBulkProtein:true,location:"Freezer",portionOz:i.portionOz||6};
        if(!fixed&&i.isBulkProtein&&(parseFloat(i.qty)||0)>50){const unit=(i.unit||"").toLowerCase();const reasonable=unit.includes("portion")?6:unit.includes("package")?2:unit.includes("count")?4:3;return{...i,qty:reasonable};}
        return i;
      });
    });
  },[]);
  useEffect(()=>{try{localStorage.setItem("sk_inventory",JSON.stringify(inventory));}catch{}},[inventory]);
  useEffect(()=>{try{localStorage.setItem("sk_mealPlan",JSON.stringify(mealPlan));}catch{}},[mealPlan]);
  useEffect(()=>{try{localStorage.setItem("sk_saleItems",JSON.stringify(saleItems));}catch{}},[saleItems]);
  useEffect(()=>{try{localStorage.setItem("sk_familySize",JSON.stringify(familySize));}catch{}},[familySize]);
  useEffect(()=>{try{localStorage.setItem("sk_familyProfiles",JSON.stringify(familyProfiles));}catch{}},[familyProfiles]);
  useEffect(()=>{try{localStorage.setItem("sk_tempProfiles",JSON.stringify(tempProfiles));}catch{}},[tempProfiles]);
  useEffect(()=>{try{localStorage.setItem("sk_seniorMode",seniorMode?"1":"0");}catch{}},[seniorMode]);
  useEffect(()=>{try{localStorage.setItem("sk_sportsNights",JSON.stringify(sportsNights));}catch{}},[sportsNights]);

  // -- Computed values --------------------------------------------------------
  const blendItem=inventory.find(i=>i.vegType==="sauteBlend");
  const proteinItems=inventory.filter(i=>i.isBulkProtein);
  const totalPortions=proteinItems.reduce((a,i)=>a+i.qty,0);
  const condimentItems=inventory.filter(i=>i.isCondiment);
  const activeProfiles=familyProfiles.filter(p=>p.active);
  const restrictedProfiles=activeProfiles.filter(p=>p.restriction!=="none"&&p.restriction!=="standard"&&p.restriction!=="athlete");
  const activeFlags=activeProfiles.flatMap(p=>RESTRICTION_PRESETS[p.restriction]?.flags||[]);
  const today=new Date().toISOString().split("T")[0];
  const activeTempProfiles=tempProfiles.filter(t=>t.startDate<=today&&(!t.endDate||t.endDate>=today));
  const tempFlags=activeTempProfiles.flatMap(t=>RESTRICTION_PRESETS[t.restriction]?.flags||[]);
  const allActiveFlags=[...new Set([...activeFlags,...tempFlags])];
  const hasNoWhiteRice=activeFlags.includes("no-white-rice");
  const hasNoRegularPasta=activeFlags.includes("no-regular-pasta");
  const hasZeroSugar=activeFlags.includes("zero-sugar");

  const familySummary=()=>{
    if(activeProfiles.length===0) return "";
    let s="FAMILY: "+activeProfiles.length+" people. ";
    if(restrictedProfiles.length>0){
      s+="DIETARY RESTRICTIONS (HARD STOPS): "+restrictedProfiles.map(p=>{
        const r=RESTRICTION_PRESETS[p.restriction];
        const f=r?.flags||[];
        const parts=[];
        if(f.includes("zero-sugar")) parts.push("ZERO SUGAR");
        if(f.includes("no-white-rice")) parts.push("NO white rice — brown rice only");
        if(f.includes("no-regular-pasta")) parts.push("NO regular pasta — whole wheat only");
        if(f.includes("low-carb")) parts.push("LOW CARB");
        if(f.includes("low-sodium")) parts.push("low sodium");
        if(f.includes("limit-protein")) parts.push("limited protein");
        const c=p.customParams||{};
        if(c.carbsPerMeal) parts.push("max "+c.carbsPerMeal+"g carbs/meal");
        if(c.sodiumMg) parts.push("max "+c.sodiumMg+"mg sodium/day");
        if(c.potassiumMg) parts.push("max "+c.potassiumMg+"mg potassium/day");
        if(c.proteinG) parts.push("max "+c.proteinG+"g protein/day");
        return (p.name||r?.label||"Person")+": "+parts.join(", ");
      }).join("; ")+". ";
    }
    const athletes=activeProfiles.filter(p=>p.restriction==="athlete");
    if(athletes.length>0) s+=athletes.length+" teen athlete(s) need larger portions. ";
    return s;
  };

  // -- Repackage helpers ------------------------------------------------------
  const openRepack=(mode)=>{setRpMode(mode);setRpPName("");setRpPLbs("");setRpPOz(6);setRpPPreview(null);setRpOpen(true);};
  const commitProtein=()=>{
    if(!rpPName||!rpPLbs) return;
    const portions=Math.floor((parseFloat(rpPLbs)*16)/rpPOz);
    setInventory(prev=>{
      const idx=prev.findIndex(i=>i.name.toLowerCase()===rpPName.toLowerCase());
      if(idx>=0) return prev.map((i,ii)=>ii===idx?{...i,qty:i.qty+portions,isBulkProtein:true,portionOz:rpPOz}:i);
      return [...prev,{id:Date.now(),name:rpPName,qty:portions,unit:"portions",category:"Protein",location:"Freezer",isBulkProtein:true,portionOz:rpPOz}];
    });
    setRpOpen(false);
  };
  const commitVeg=()=>{
    const valid=rpVSessions.filter(s=>s.bags&&s.bags>0);
    if(!valid.length) return;
    setInventory(prev=>{
      let u=[...prev];
      valid.forEach(s=>{
        const idx=u.findIndex(i=>i.vegType==="sauteBlend");
        if(idx>=0){u[idx]={...u[idx],qty:u[idx].qty+s.bags};}
        else{u.push({id:Date.now(),name:"Mixed Sauté Blend",qty:s.bags,unit:"2-cup bags",category:"Produce",location:"Freezer",isDicedVeg:true,vegType:"sauteBlend",cupsPerBag:2,blendNote:"Diced onion + celery + bell pepper"});}
      });
      return u;
    });
    setRpOpen(false);
  };

  // -- Scan -------------------------------------------------------------------
  const onFile=async(file)=>{
    if(!file) return;
    setScanPreview(URL.createObjectURL(file));
    setScanB64(await fileToBase64(file));
    setScanMime(file.type||"image/jpeg");
    setScanResults(null); setScanStage("upload");
  };
  const analyzeReceipt=async()=>{
    if(!scanB64) return;
    setScanStage("analyzing");
    setLoading(true); setLoadMsg("Reading receipt…");
    try{
      const raw=await callClaude({
        system:"You are a grocery receipt parser specialized in Meijer store receipts. Analyze this receipt image and extract every food/grocery item purchased. Return ONLY a valid JSON array. No markdown, no preamble.\n\nRULES:\n1. DUPLICATE HANDLING: If the EXACT same product appears multiple times (same name, same price), combine into one object with summed qty. However if similar items appear with DIFFERENT SKUs or flavors (e.g. two different ice cream flavors), keep them SEPARATE but flag confidence as medium. If an item has quantity printed (e.g. '2 @ $1.99'), use that quantity.\n2. UNIT RULES: Bananas/grapes→bunch. Milk→gallon. Eggs→dozen. Bread→loaf. Meat/fish by weight→lb. Ice cream/frozen novelty→container. Produce bags (onions/potatoes)→bag. Canned goods→can. Bottles→bottle. Multi-packs→count. Default→each.\n3. LOCATION RULES (MUST follow exactly): Protein/Meat/Seafood/Poultry/Pork/Beef/Fish/Ice cream/Frozen→Freezer. Dairy/Eggs/Deli/Juice/Condiments/Dressings→Fridge. Fresh produce (bananas/apples/oranges/tomatoes/peppers)→Fridge. Bagged produce (onions/potatoes/carrots)→Pantry. Canned/Dry/Spices/Grains/Baking/Snacks/Beverages→Pantry.\n4. MEIJER SPECIFICS: Ignore PLU numbers, barcodes, discount lines (SAVE, MPERKS, COUPON, MFR), tax lines, subtotals and totals. Clean brand names (MEIJER ORG→Organic [Item], WB→Wright Brand).\n5. CONFIDENCE: high=clearly readable name+price. medium=similar items or slightly unclear. low=guessed from partial text.\n\nEach object: {name, qty(number), unit, category(Protein|Produce|Dairy|Pantry|Baking|Grains|Spices|Frozen|Condiments|Other), location(Freezer|Fridge|Pantry), isProtein(boolean), price(string), confidence(high|medium|low), expiryDays(number|null, estimated days until expiry: fresh meat=2, ground beef=2, pork=3, chicken=2, fish=1, milk=7, eggs=21, cheese=14, yogurt=10, fresh produce=5, bananas=5, bread=5, deli meat=5, frozen=180, canned=730, dry goods=365, condiments=180, null for pantry staples with very long shelf life)}. Skip non-food items.",
        prompt:"Parse this grocery receipt. Extract every food item purchased with quantity and category.",
        imageBase64:scanB64,imageType:scanMime,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1) throw new Error("Could not read receipt");
      const parsed=JSON.parse(raw.slice(s,e+1));
      const isUpd=(name)=>inventory.some(i=>i.name.toLowerCase()===name.toLowerCase());
      const smartLoc=(item)=>{if(item.location)return item.location;if(item.category==="Protein")return"Freezer";if(item.category==="Dairy")return"Fridge";if(item.category==="Condiments")return"Fridge";if(item.category==="Frozen")return"Freezer";if(item.category==="Produce")return"Fridge";return"Pantry";};
      setScanResults(parsed.map(i=>({...i,location:smartLoc(i),action:isUpd(i.name)?"update":"add",selected:true})));
      setScanStage("review");
    } catch(e){ alert("Receipt scan failed: "+e.message); }
    setLoading(false);
  };

  const analyzePhoto=async()=>{
    if(!scanB64) return;
    setScanStage("analyzing");
    setLoading(true); setLoadMsg("Scanning shelf photo…");
    try{
      const raw=await callClaude({
        system:"Kitchen inventory AI. Analyze the photo. Return ONLY valid JSON array. Each item: {name,qty,unit,category,location,confidence,expiryDays}. category is one of: Protein, Produce, Dairy, Pantry, Baking, Grains, Spices, Frozen, Condiments, Other. location rules (MUST follow): Protein/Meat/Seafood/Poultry/Pork/Beef/Fish = Freezer. Dairy/Eggs/Fresh Produce/Deli meats/Condiments/Dressings = Fridge. Canned goods/Dry goods/Spices/Grains/Baking/Snacks/Beverages = Pantry. Frozen packaged foods = Freezer. confidence is high, medium, or low. expiryDays is estimated days until expiry once opened or from purchase: fresh meat/poultry=2, pork=3, fish=1, ground beef=2, milk=7, eggs=21, cheese=14, yogurt=10, fresh produce=5, bananas=5, bread=5, deli meat=5, frozen=180, canned=730, dry goods=365, condiments=180, null for very long shelf life staples.",
        prompt:"List every visible food item stored here. For each item, determine the most likely storage location based on the food type: use Freezer for frozen foods, Fridge for dairy/fresh produce/condiments, Pantry for dry goods/canned goods/snacks/spices.",
        imageBase64:scanB64,imageType:scanMime,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1) throw new Error("No data");
      const parsed=JSON.parse(raw.slice(s,e+1));
      const isUpd=(name)=>inventory.some(i=>i.name.toLowerCase()===name.toLowerCase());
      setScanResults(parsed.map(i=>({...i,location:i.location||scanLoc||smartLoc(i),action:isUpd(i.name)?"update":"add",selected:true})));
      setScanStage("review");
    } catch(e){ alert("Scan failed — try a clearer photo."); }
    setLoading(false);
  };
  const analyzeWeeklyAd=async()=>{
    if(!scanB64) return;
    setScanStage("analyzing");
    setLoading(true); setLoadMsg("Reading weekly ad…");
    try{
      const raw=await callClaude({
        system:"You are a grocery store weekly ad parser. Analyze this store ad image and extract food/grocery sale items. Return ONLY a valid JSON array. Each object: {name(string, clean product name), salePrice(string, e.g. '$2.99'), regularPrice(string or null), unit(string, e.g. 'lb' 'each' 'pkg'), category(Protein|Produce|Dairy|Pantry|Grains|Frozen|Condiments|Other), savings(string, e.g. 'Save $1.00' or 'BOGO' or '2 for $5')}. Focus on food items only. Skip non-food deals.",
        prompt:"Extract all food sale items from this weekly grocery ad. Include sale price, unit, and any savings details visible.",
        imageBase64:scanB64,imageType:scanMime,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1) throw new Error("Could not read ad");
      const parsed=JSON.parse(raw.slice(s,e+1));
      setSaleItems(parsed);
      setScanStage("review");
      setScanResults(parsed.map(i=>({...i,selected:true,qty:1,location:"Store",action:"sale"})));
    } catch(e){ alert("Ad scan failed: "+e.message); }
    setLoading(false);
  };
  const commitScan=()=>{
    const chosen=scanResults.filter(i=>i.selected);
    const hasProteins=chosen.some(i=>i.isProtein||i.category==="Protein");
    setInventory(prev=>{
      const u=[...prev];
      chosen.forEach(si=>{
        const idx=u.findIndex(i=>i.name.toLowerCase()===si.name.toLowerCase());
        if(idx>=0){u[idx]={...u[idx],qty:si.qty,unit:si.unit,location:si.location};}
        else{u.push({id:Date.now()+Math.random(),name:si.name,qty:si.qty,unit:si.unit,category:si.category,location:si.location});}
      });
      return u;
    });
    setScanStage("done");
    setTimeout(()=>{
      setScanOpen(false);setScanPreview(null);setScanB64(null);setScanResults(null);setScanStage("upload");
      setTab("inventory");
      if(hasProteins&&scanMode==="receipt"){
        setTimeout(()=>{
          if(window.confirm("Proteins detected in your receipt. Would you like to repackage them into dinner portions now?")) openRepack("protein");
        },600);
      }
    },1500);
  };

  // -- AI functions -----------------------------------------------------------
  const fetchRecipes=async()=>{
    setLoading(true); setLoadMsg("Analyzing your kitchen…"); setRecipeError(""); setTab("recipes");
    try{
      const proteins=proteinItems.map(i=>i.name+" "+i.qty).join(", ");
      const veg=(blendItem?.qty||0)+" saute blend bags";
      const fs=familySummary();
      const raw=await callClaude({
        system:"Return ONLY a JSON array of 4 dinner recipes. No other text. Start with [ end with ]. Each object has exactly these keys: id (number), name (string), time (string like 30 min), difficulty (Easy or Medium or Hard), description (one short sentence), usesFromInventory (array of 3 strings max), missingIngredients (array of strings), instructions (array of 4 short strings). Keep all strings short.",
        prompt:"Proteins: "+proteins+". Saute blend bags: "+(blendItem?.qty||0)+". Make 4 simple weeknight dinners for 3 people. Vary proteins — include beef and pork not just chicken. Pantry/fridge inventory (match case-insensitively): "+inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")+". For missingIngredients only list items NOT in that inventory.",
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1||e===-1) throw new Error("No recipes returned");
      setRecipes(JSON.parse(raw.slice(s,e+1)));
      setRecipeError("");
    } catch(err){ setRecipeError("Could not load recipes: "+err.message); setRecipes([]); }
    setLoading(false);
  };

  const buildSaleMealPlan=async()=>{
    if(saleItems.length===0){alert("No sale items loaded. Scan a weekly ad first.");return;}
    setLoading(true); setLoadMsg("Building sale meal plan…"); setTab("mealplan");
    try{
      const proteins=proteinItems.map(i=>i.name+" "+i.qty+" portions").join(", ");
      const saleList=saleItems.map(i=>i.name+(i.salePrice?" ("+i.salePrice+")":"")+(i.savings?" — "+i.savings:"")).join(", ");
      const invList=inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ");
      const fs=familySummary();
      const raw=await callClaude({
        system:"Return ONLY a JSON array of 7 dinner plan objects. No other text. Start with [ end with ]. Each: {day,meal,proteinUsed,sauteBagsUsed,sideUsed,shoppingNeeded}. day is Monday through Sunday. shoppingNeeded is array of {name,qty,unit} — ONLY items NOT in inventory.",
        prompt:"This week's Meijer sale items: "+saleList+". Proteins on hand: "+proteins+". Full inventory (do NOT list in shoppingNeeded): "+invList+". "+fs+"Build a 7-day dinner plan that PRIORITIZES sale items to maximize savings. Use sale proteins and produce first. shoppingNeeded should only list items not in inventory, and prefer sale-priced items when shopping is needed.",
        maxTokens:3000,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1||e===-1) throw new Error("No plan returned");
      setMealPlan(JSON.parse(raw.slice(s,e+1)));
    } catch(err){ alert("Could not build sale meal plan: "+err.message); }
    setLoading(false);
  };
  const buildMealPlan=async()=>{
    setLoading(true); setLoadMsg("Building meal plan…"); setTab("mealplan");
    try{
      const proteins=proteinItems.map(i=>i.name+" "+i.qty+" portions").join(", ");
      const fs=familySummary();
      const raw=await callClaude({
        system:"Return ONLY a JSON array of 7 dinner plan objects. No other text. Start with [ end with ]. Each: {day,meal,proteinUsed,sauteBagsUsed,sideUsed,shoppingNeeded}. day is Monday through Sunday. proteinUsed is string or null. sauteBagsUsed is number. sideUsed is string or null. shoppingNeeded is array of {name,qty,unit} — ONLY items NOT in the inventory list.",
        prompt:"Proteins available: "+proteins+". Saute blend: "+(blendItem?.qty||0)+" bags. Full inventory on hand (DO NOT put these in shoppingNeeded): "+inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")+". "+fs+"Plan 7 dinners Mon-Sun using proteins and inventory above. Max 3 chicken meals. At least 1 beef. At least 1 pork or kielbasa. No same protein two days in a row. shoppingNeeded must ONLY list items not found in the inventory list above.",
        maxTokens:3000,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1||e===-1) throw new Error("No plan returned");
      setMealPlan(JSON.parse(raw.slice(s,e+1)));
    } catch(err){ alert("Could not build meal plan: "+err.message); }
    setLoading(false);
  };

  const quickMealForDay=async(dayIdx)=>{
    const day=mealPlan[dayIdx];
    if(!day) return;
    setLoading(true); setLoadMsg("Finding quick meal for "+day.day+"...");
    try{
      const proteins=proteinItems.map(i=>i.name+" "+i.qty+" portions").join(", ");
      const fs=familySummary();
      const raw=await callClaude({
        system:"Return ONLY raw JSON — no markdown, no code fences, no backticks, no explanation. A single JSON object with these exact keys: day, meal, proteinUsed, sauteBagsUsed, sideUsed, shoppingNeeded. shoppingNeeded is array of {name,qty,unit}. Start your response with { and end with }.",
        prompt:"Proteins: "+proteins+". Saute blend: "+(blendItem?.qty||0)+" bags. "+fs+"Busy night on "+day.day+". Already this week: "+mealPlan.filter((_,ii)=>ii!==dayIdx).map(d=>d.meal).filter(Boolean).join(", ")+". Give ONE DIFFERENT quick dinner under 20 min — tacos, stir fry, sandwiches, or wraps. No duplicates"+". INVENTORY OWNED (do NOT include these in shoppingNeeded — match by keyword, ignore quantities and units): "+inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")+". RULE: if a shoppingNeeded item name contains any word from an inventory item name (or vice versa), it is already owned — omit it. E.g. if inventory has Eggs, do not add 2 whole Eggs. If inventory has Instant Rice, do not add Quick Fried Rice.",
        maxTokens:500,
      });
      const cleaned=raw.replace(/```json|```/g,"").trim();
      const s=cleaned.indexOf("{"),e=cleaned.lastIndexOf("}");
      if(s===-1||e===-1) throw new Error("No meal returned");
      const newDay={...JSON.parse(cleaned.slice(s,e+1)),day:day.day,quickMeal:true};
      setMealPlan(prev=>prev.map((d,i)=>i===dayIdx?newDay:d));
      setSportsNights(prev=>prev.includes(dayIdx)?prev:[...prev,dayIdx]);
    } catch(err){ alert("Could not get quick meal: "+err.message); }
    setLoading(false);
  };

  const clearQuickMeal=async(dayIdx)=>{
    setSportsNights(prev=>prev.filter(i=>i!==dayIdx));
    setLoading(true); setLoadMsg("Restoring meal for "+mealPlan[dayIdx]?.day+"...");
    try{
      const proteins=proteinItems.map(i=>i.name+" "+i.qty+" portions").join(", ");
      const fs=familySummary();
      const raw=await callClaude({
        system:"Return ONLY raw JSON — no markdown, no code fences, no backticks, no explanation. A single JSON object with these exact keys: day, meal, proteinUsed, sauteBagsUsed, sideUsed, shoppingNeeded. shoppingNeeded is array of {name,qty,unit}. Start your response with { and end with }.",
        prompt:"Proteins: "+proteins+". Saute blend: "+(blendItem?.qty||0)+" bags. "+fs+"Regular weeknight dinner for "+mealPlan[dayIdx]?.day+". 30-45 min OK"+". INVENTORY OWNED (do NOT include these in shoppingNeeded — match by keyword, ignore quantities and units): "+inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")+". RULE: if a shoppingNeeded item name contains any word from an inventory item name (or vice versa), it is already owned — omit it. E.g. if inventory has Eggs, do not add 2 whole Eggs. If inventory has Instant Rice, do not add Quick Fried Rice.",
        maxTokens:500,
      });
      const cleaned=raw.replace(/```json|```/g,"").trim();
      const s=cleaned.indexOf("{"),e=cleaned.lastIndexOf("}");
      if(s===-1||e===-1) throw new Error("No meal returned");
      const newDay={...JSON.parse(cleaned.slice(s,e+1)),day:mealPlan[dayIdx]?.day,quickMeal:false};
      setMealPlan(prev=>prev.map((d,i)=>i===dayIdx?newDay:d));
    } catch(err){ alert("Could not restore meal: "+err.message); }
    setLoading(false);
  };

  const regenerateDay=async(dayIdx)=>{
    const day=mealPlan[dayIdx];
    if(!day) return;
    setLoading(true); setLoadMsg("Finding new meal for "+day.day+"...");
    try{
      const proteins=proteinItems.map(i=>i.name+" "+i.qty+" portions").join(", ");
      const fs=familySummary();
      const otherMeals=mealPlan.filter((_,ii)=>ii!==dayIdx).map(d=>d.meal).filter(Boolean).join(", ");
      const raw=await callClaude({
        system:"Return ONLY raw JSON — no markdown, no code fences, no backticks, no explanation. A single JSON object with these exact keys: day, meal, proteinUsed, sauteBagsUsed, sideUsed, shoppingNeeded. shoppingNeeded is array of {name,qty,unit}. Start your response with { and end with }.",
        prompt:"Proteins: "+proteins+". Saute blend: "+(blendItem?.qty||0)+" bags. "+fs+"Already planned: "+otherMeals+". ONE DIFFERENT weeknight dinner for "+day.day+" — must differ from all above. 30-45 min OK.",
        maxTokens:500,
      });
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      if(s===-1||e===-1) throw new Error("No meal returned");
      const newDay={...JSON.parse(raw.slice(s,e+1)),day:day.day,quickMeal:false};
      setMealPlan(prev=>prev.map((d,i)=>i===dayIdx?newDay:d));
    } catch(err){ alert("Could not regenerate meal: "+err.message); }
    setLoading(false);
  };

  const getRecipeUrl=(meal)=>{const q=encodeURIComponent(meal+" recipe");const sites={google:"https://www.google.com/search?q=",allrecipes:"https://www.allrecipes.com/search?q=",pinterest:"https://www.pinterest.com/search/pins/?q=",foodnetwork:"https://www.foodnetwork.com/search/"+encodeURIComponent(meal)};if(recipeSite==="foodnetwork")return sites.foodnetwork;return(sites[recipeSite]||sites.google)+q;};
  const madeMeal=(day)=>{if(!day)return;setInventory(prev=>prev.map(item=>{if(day.proteinUsed&&item.name.toLowerCase().includes(day.proteinUsed.toLowerCase())&&item.isBulkProtein)return{...item,qty:Math.max(0,item.qty-1)};if((day.sauteBagsUsed||0)>0&&item.vegType==="sauteBlend")return{...item,qty:Math.max(0,item.qty-(day.sauteBagsUsed||0))};if(day.sideUsed&&item.name.toLowerCase().includes(day.sideUsed.toLowerCase()))return{...item,qty:Math.max(0,item.qty-1)};return item;}));alert("Meal logged! Inventory updated.");};
  const completeWizard=(includePantry=false,openScan=false)=>{
    if(openScan){try{localStorage.setItem("sk_setupDone","1");}catch{} setShowWizard(false);setTimeout(()=>setScanOpen(true),300);return;}
    const proteins=wizardProteins.map((p,i)=>({id:900+i,name:p.name,qty:parseInt(p.qty)||0,unit:"portions",category:"Protein",location:"Freezer",isBulkProtein:true,portionOz:parseInt(p.oz)||6}));
    const pantry=includePantry?pantryChecklist.filter(i=>i.checked).map(({checked,...i})=>i):[];
    const missing=includePantry?pantryChecklist.filter(i=>!i.checked):[];
    if(proteins.length>0||pantry.length>0) setInventory([...proteins,...pantry]);
    if(missing.length>0){const wantList=window.confirm("You don't have "+missing.length+" staples. Add them to your Shopping List?");if(wantList){setShopping(missing.map(i=>({name:i.name,qty:i.qty,unit:i.unit,category:i.category,checked:false,suggestBulk:false})));setTab("shopping");}}
    try{ localStorage.setItem("sk_setupDone","1"); }catch{}
    setShowWizard(false);
    if(openScan){setTimeout(()=>setScanOpen(true),300);setTab("inventory");}
  };
  const genShopping=async()=>{
    if(!mealPlan.length) return;
    setLoading(true); setLoadMsg("Building shopping list…");
    try{
      const needed=mealPlan.flatMap(d=>d.shoppingNeeded||[]);
      const raw=await callClaude({
        system:"Return ONLY a JSON array. No other text. Start with [ end with ]. Each: {name,qty,unit,category,checked,suggestBulk}. category is Protein Produce Dairy Pantry Grains Spices Frozen Condiments or Other. checked is false. suggestBulk is boolean.",
        prompt:"Consolidate this shopping list for a family of "+activeProfiles.length+": "+JSON.stringify(needed),
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1||e===-1) throw new Error("No list returned");
      setShopping(JSON.parse(raw.slice(s,e+1)));
      setTab("shopping");
    } catch(err){ alert("Could not generate shopping list: "+err.message); }
    setLoading(false);
  };

  const fetchDesserts=async()=>{
    setDessertLoading(true); setDessertError(""); setTab("desserts");
    try{
      const invList=inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ");
      const raw=await callClaude({
        system:"Return ONLY a JSON array of 3 dessert recipes. No other text. Start with [ end with ]. Each object: {id(number),name(string),time(string),difficulty(Easy|Medium|Hard),category(Baked|No-Bake|Quick-Treat),description(one sentence),steps(array of 3 short strings),servings(number),usesFromInventory(array of ingredient names from inventory),missingIngredients(array of items NOT in inventory)}.",
        prompt:"Full pantry/fridge inventory: "+invList+". Suggest 3 easy desserts using what's on hand. Prefer ingredients already in inventory. missingIngredients must ONLY list items NOT in the inventory above.",
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1||e===-1) throw new Error("No desserts returned");
      setDesserts(JSON.parse(raw.slice(s,e+1)));
      setDessertError("");
    } catch(err){ setDessertError("Could not load desserts: "+err.message); }
    setDessertLoading(false);
  };

  const cookRecipe=(r)=>{
    setInventory(p=>p.map(i=>{
      if(!(r.usesFromInventory||[]).includes(i.name)) return i;
      if(i.isBulkProtein||i.isDicedVeg) return {...i,qty:Math.max(0,i.qty-1)};
      return {...i,qty:Math.max(0,+(i.qty-1).toFixed(1))};
    }));
    setActiveRecipe(null);
    alert("✅ \""+r.name+"\" cooked! Inventory updated.");
  };

  const openMealPlanRecipe=async(day)=>{
    const invList=inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ");
    setActiveRecipe({name:day.meal,description:"Loading recipe...",time:"...",difficulty:"Easy",instructions:[],missingIngredients:[],usesFromInventory:[]});
    try{
      const raw=await callClaude({
        system:"Recipe AI. Return ONLY valid JSON, no markdown. Single object.",
        prompt:`Give a simple home recipe for "${day.meal}". Full inventory on hand: ${invList}. Return JSON: {name,description,time,difficulty,instructions:[4 short strings],usesFromInventory:[items from inventory used],missingIngredients:[items NOT in inventory]}`,
        maxTokens:600
      });
      const text=typeof raw==="string"?raw:Array.isArray(raw)?raw.map(r=>r.text||"").join(""):raw?.content?.[0]?.text||"";
      const clean=text.replace(/\`\`\`json|\`\`\`/g,"").trim();
      const s=clean.indexOf("{"),e=clean.lastIndexOf("}");
      const parsed=JSON.parse(clean.slice(s,e+1));
      setActiveRecipe({...parsed,name:parsed.name||day.meal});
    }catch(err){
      setActiveRecipe({name:day.meal,description:"See full recipe online.",time:"~30 min",difficulty:"Easy",instructions:["Tap TAP FOR FULL RECIPE to see detailed instructions online."],missingIngredients:day.shoppingNeeded?.map(s=>s.name)||[],usesFromInventory:[]});
    }
  };
  const addItem=()=>{
    if(!newItem.name||!newItem.qty) return;
    const isProtein=newItem.category==="Protein";
    const item={...newItem,id:Date.now(),qty:parseFloat(newItem.qty)};
    if(isProtein){item.isBulkProtein=true;if(!newItem.location||newItem.location==="Pantry")item.location="Freezer";if(!item.unit)item.unit="portions";if(!item.portionOz)item.portionOz=6;}
    setInventory(p=>[...p,item]);
    setNewItem({name:"",qty:"",unit:"",category:"Pantry",location:"Pantry"});
    setShowAdd(false);
  };

  // -- Print helpers ----------------------------------------------------------
  const printMealPlan=()=>setPrintModal("mealplan");
  const printShopping=()=>setPrintModal("shopping");

  // -- Push to Google Calendar ------------------------------------------------
  const pushToCalendar=async()=>{
    if(!mealPlan.length) return;
    try{
      const today=new Date();
      const daysToMon=today.getDay()===0?1:8-today.getDay();
      const monday=new Date(today);
      monday.setDate(today.getDate()+daysToMon);
      const offsets={Monday:0,Tuesday:1,Wednesday:2,Thursday:3,Friday:4,Saturday:5,Sunday:6};
      for(const day of mealPlan){
        const d=new Date(monday);
        d.setDate(monday.getDate()+(offsets[day.day]??0));
        const dateStr=d.toISOString().split("T")[0];
        const desc=[
          day.proteinUsed?"🥩 "+day.proteinUsed:"",
          (day.sauteBagsUsed||0)>0?"🫕 Saute blend: "+day.sauteBagsUsed+" bag":"",
          day.sideUsed?"🥦 Side: "+day.sideUsed:"",
          (day.shoppingNeeded||[]).length>0?"🛒 Need: "+day.shoppingNeeded.map(s=>s.name).join(", "):"✅ All on hand",
        ].filter(Boolean).join("\n");
        await window.claude_mcp_google_calendar_create_event?.({summary:"🍽 Dinner: "+day.meal,description:desc,start:{date:dateStr},end:{date:dateStr}});
      }
      alert("✅ Meal plan added to Google Calendar!");
    } catch(e){ alert("Calendar push failed: "+e.message); }
  };

  const filtered=inventory.filter(i=>(filterCat==="All"||i.category===filterCat)&&(filterLoc==="All"||i.location===filterLoc));

  // -- Render -----------------------------------------------------------------
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:FB}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>

  
      {showSettings&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowSettings(false)}><div style={{background:C.card,borderRadius:16,padding:28,width:340,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>Settings</div><div style={{fontSize:11,color:C.muted,fontFamily:FM,marginBottom:20}}>Smart Kitchen v1.5</div><div style={{marginTop:12,background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>Shopping Partner</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:6}}>Who gets the emailed shopping list?</div><input placeholder="Name (e.g. Lisa)" value={shopPartnerName} onChange={e=>{setShopPartnerName(e.target.value);localStorage.setItem("sk_shopPartnerName",e.target.value);}} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:FM,fontSize:12,marginBottom:6,boxSizing:"border-box"}}/><input placeholder="Email address" value={shopPartnerEmail} onChange={e=>{setShopPartnerEmail(e.target.value);localStorage.setItem("sk_shopPartnerEmail",e.target.value);}} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:FM,fontSize:12,boxSizing:"border-box"}}/></div><div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>Reset Inventory</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:10}}>Clears all inventory items. Keeps profiles, meal plan, and preferences.</div><button style={{...bBtn("ghost"),width:"100%",border:"1px solid "+C.red,color:C.red}} onClick={()=>{if(window.confirm("Clear all inventory? Cannot be undone.")){localStorage.removeItem("sk_inventory");localStorage.removeItem("sk_portionFixV2");setInventory([]);setShowSettings(false);alert("Inventory cleared.");}}}>Clear Inventory</button></div><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>Reset All Data</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:10}}>Wipes everything and restarts the Setup Wizard. Use for demo resets.</div><button style={{...bBtn("ghost"),width:"100%",border:"1px solid "+C.red,color:C.red}} onClick={()=>{if(window.confirm("Reset ALL data? Cannot be undone.")){["sk_inventory","sk_familyProfiles","sk_familySize","sk_mealPlan","sk_sportsNights","sk_recipeSite","sk_seniorMode","sk_setupDone","sk_portionFixV2","sk_installDismissed","sk_reminderDismissed","sk_saleItems","sk_tempProfiles"].forEach(k=>localStorage.removeItem(k));window.location.reload();}}}>Reset All Data</button></div></div><button style={{...bBtn("ghost"),width:"100%",marginTop:16}} onClick={()=>setShowSettings(false)}>Close</button></div></div>}
    {showWizard&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.surface,borderRadius:16,padding:28,maxWidth:440,width:"100%",border:"1px solid "+C.border,maxHeight:"90vh",overflowY:"auto"}}>
            {wizardStep===-2&&(<div style={{textAlign:"center",padding:"8px 0",maxHeight:"70vh",overflowY:"auto"}}>
              <img src="data:image/jpeg;base64,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" alt="Smart Kitchen" style={{width:"200px",height:"auto",marginBottom:16,borderRadius:20,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}/>
              <div style={{fontFamily:FD,fontSize:24,color:C.accent,marginBottom:8}}>Welcome to Smart Kitchen</div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:14,color:C.text,lineHeight:1.7,marginBottom:20}}>Your personal AI-powered kitchen assistant — designed to help your family eat well, waste less, and spend smarter.</div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24,textAlign:"left"}}>
                {[
                  ["📦","Inventory","Scan receipts and shelves to track what you have on hand"],
                  ["🍽️","Meal Planning","Get a personalized 7-day dinner plan based on your proteins and pantry"],
                  ["🔍","Recipes","AI-suggested recipes with step-by-step instructions"],
                  ["🏷️","Sale Shopping","Scan weekly ads to build budget meal plans around what's on sale"],
                ].map(([icon,title,desc])=>(
                  <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start",background:C.card,borderRadius:10,padding:"10px 12px"}}>
                    <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
                    <div>
                      <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,fontWeight:700,color:C.accent,marginBottom:2}}>{title}</div>
                      <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:C.muted,lineHeight:1.5}}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>Setup takes about 2 minutes. You can always update your preferences later.</div>
              <button style={{...bBtn("primary"),width:"100%",padding:14,fontSize:15}} onClick={()=>setWizardStep(-1)}>
                Let's Get Started →
              </button>
            </div>)}
            {wizardStep===-1&&(<div style={{padding:"4px 0"}}>
              <div style={{fontFamily:FD,fontSize:22,color:C.accent,marginBottom:4,textAlign:"center"}}>Here's what we'll set up</div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,color:C.muted,marginBottom:18,textAlign:"center",lineHeight:1.6}}>Just 3 quick steps — takes about 2 minutes.</div>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start",background:C.card,borderRadius:12,padding:"14px"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👨‍👩‍👧</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>1. Family Profile</div>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:C.muted,lineHeight:1.6}}>Tell us who you're cooking for and any dietary or medical needs — <strong style={{color:C.text}}>diabetic-friendly, low sodium, gluten-free</strong>, and more. Smart Kitchen will <strong style={{color:"#22c55e"}}>automatically enforce these in every recipe and meal plan.</strong></div>
                  </div>
                </div>
                <div style={{display:"flex",gap:14,alignItems:"flex-start",background:C.card,borderRadius:12,padding:"14px"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📦</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>2. Your Inventory</div>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:C.muted,lineHeight:1.6}}>We'll quickly add proteins, pantry staples, and what you already have on hand — scan or type, whichever is easier.</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:14,alignItems:"flex-start",background:C.card,borderRadius:12,padding:"14px"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🍽️</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>3. Meal Preferences</div>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:C.muted,lineHeight:1.6}}>How your family likes to eat — quick weeknight meals, busy sports nights, favorite cuisines, and more.</div>
                  </div>
                </div>
              </div>
              <div style={{background:"#1a2e1a",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:16}}>💡</span>
                <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:"#86efac",lineHeight:1.5}}>You can always update any of these later from the app settings.</div>
              </div>
              <button style={{...bBtn("primary"),width:"100%",padding:14,fontSize:15}} onClick={()=>setWizardStep(0)}>
                Let's Begin →
              </button>
            </div>)}
            {wizardStep===0&&(<div>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:6}}>👨‍👩‍👧 Family Profile</div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>Tell us about your household so meal plans respect everyone's needs.</div>
              <div style={{background:C.card,borderRadius:10,padding:14,marginBottom:14}}>
                <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginBottom:8,letterSpacing:0.8}}>FAMILY SIZE</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7,8].map(n=>(
                    <button key={n} onClick={()=>{setFamilySize(n);setFamilyProfiles(p=>p.map((pr,i)=>({...pr,active:i<n})));}}
                      style={{width:38,height:38,borderRadius:8,border:"1px solid "+(familySize===n?C.accent:C.border),background:familySize===n?C.accent+"22":"transparent",color:familySize===n?C.accent:C.muted,cursor:"pointer",fontFamily:FM,fontSize:14,fontWeight:600}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:9,maxHeight:280,overflowY:"auto",marginBottom:14}}>
                {familyProfiles.filter(p=>p.active).map((profile,idx)=>{
                  const preset=RESTRICTION_PRESETS[profile.restriction]||RESTRICTION_PRESETS.standard;
                  return(
                    <div key={profile.id} style={{background:C.card,borderRadius:12,padding:14}}>
                      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                        <div style={{fontSize:18}}>{preset.icon}</div>
                        <input style={{...bInp,flex:1}} placeholder={"Person "+(idx+1)+" name"} value={profile.name}
                          onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,name:e.target.value}:pr))}/>
                      </div>
                      <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginBottom:6,letterSpacing:0.8}}>DIETARY NEEDS</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {Object.entries(RESTRICTION_PRESETS).map(([k,r])=>(
                          <button key={k} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,restriction:k}:pr))}
                            style={{padding:"4px 10px",borderRadius:20,border:"1px solid "+(profile.restriction===k?r.color:C.border),background:profile.restriction===k?r.color+"22":"transparent",color:profile.restriction===k?r.color:C.muted,fontFamily:FM,fontSize:11,cursor:"pointer"}}>
                            {r.icon} {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(-1)}>← Back</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>setWizardStep(1)}>Next →</button>
              </div>
            </div>)}
            {wizardStep===1&&(<div>
              <div style={{fontFamily:FD,fontSize:24,color:C.accent,marginBottom:8}}>👋 Let's set up your kitchen!</div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:14,color:C.muted,marginBottom:20,lineHeight:1.7}}>Takes about 2 minutes. We'll start with your <strong>family profile</strong> — dietary needs and restrictions — then add your <strong>proteins</strong> so we can build your first personalized meal plan.</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:12}}>How would you like to get started?</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button style={{...bBtn("primary"),padding:"14px",textAlign:"left"}} onClick={()=>{try{localStorage.setItem('sk_setupDone','1');}catch{} setShowWizard(false);setTimeout(()=>setScanOpen(true),300);}}>
              <div style={{fontFamily:FD,fontSize:14}}>📸 Scan items with camera</div>
              <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>Take photos of receipts, packages, or pantry items</div>
            </button>
            <button style={{...bBtn("ghost"),padding:"14px",textAlign:"left"}} onClick={()=>setWizardStep(2)}>
              <div style={{fontFamily:FD,fontSize:14}}>✏️ Enter items manually</div>
              <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>Type in your proteins, produce, and pantry staples</div>
            </button>
          </div>
            </div>)}
            {wizardStep===2&&(<div>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:6}}>🥩 Add Your Proteins</div>
              <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:16}}>What proteins do you have in your freezer?</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input placeholder="Protein name" style={{...bInp,flex:2}} value={wizardProteinInput.name} onChange={e=>setWizardProteinInput(p=>({...p,name:e.target.value}))}/>
                <input placeholder="Qty" style={{...bInp,flex:1,width:60}} value={wizardProteinInput.qty} onChange={e=>setWizardProteinInput(p=>({...p,qty:e.target.value}))} type="number"/>
                <input placeholder="Oz" style={{...bInp,flex:1,width:60}} value={wizardProteinInput.oz} onChange={e=>setWizardProteinInput(p=>({...p,oz:e.target.value}))} type="number"/>
              </div>
              <button style={{...bBtn("primary"),marginBottom:16,width:"100%"}} onClick={()=>{if(wizardProteinInput.name&&wizardProteinInput.qty){setWizardProteins(p=>[...p,{...wizardProteinInput}]);setWizardProteinInput({name:"",qty:"",oz:"6"});}}}>+ Add Protein</button>
              {wizardProteins.map((p,i)=><div key={i} style={{fontFamily:FM,fontSize:12,color:C.text,padding:"6px 10px",background:C.card,borderRadius:8,marginBottom:6,display:"flex",justifyContent:"space-between"}}><span>{p.name} — {p.qty} portions ({p.oz}oz)</span><span style={{cursor:"pointer",color:C.red}} onClick={()=>setWizardProteins(prev=>prev.filter((_,j)=>j!==i))}>✕</span></div>)}
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(3)}>Skip</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>setWizardStep(3)}>Next →</button>
              </div>
            </div>)}
            {wizardStep===3&&(<div>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:6}}>🔍 Recipe Search</div>
              <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:16}}>When you tap a meal name, which site opens for detailed recipes?</div>
              {[["google","🔍 Google Recipes"],["allrecipes","🍳 AllRecipes"],["pinterest","📌 Pinterest"],["foodnetwork","📺 Food Network"]].map(([key,label])=>(
                <div key={key} onClick={()=>setRecipeSite(key)} style={{padding:"12px 16px",borderRadius:10,marginBottom:8,cursor:"pointer",border:"2px solid "+(recipeSite===key?C.accent:C.border),background:recipeSite===key?C.accent+"11":C.card,fontFamily:FM,fontSize:13,color:recipeSite===key?C.accent:C.text}}>{label}</div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(2)}>← Back</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>setWizardStep(4)}>Next →</button>
              </div>
            </div>)}
            {wizardStep===4&&(<div>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:6}}>📦 Inventory Setup</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>How do you want to start your pantry inventory?</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button style={{...bBtn('primary'),padding:'16px',textAlign:'left'}} onClick={()=>{setPantryChecklist(COMMON_PANTRY.map(i=>({...i,checked:true})));setWizardStep(5)}}>
                  <div style={{fontFamily:FD,fontSize:14}}>✅ Start with common pantry items</div>
                  <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>We'll pre-check ~30 staples — just uncheck what you don't have</div>
                </button>
                <button style={{...bBtn('ghost'),padding:'16px',textAlign:'left'}} onClick={()=>{setPantryChecklist(COMMON_PANTRY.map(i=>({...i,checked:false})));setWizardStep(5)}}>
                  <div style={{fontFamily:FD,fontSize:14}}>🔲 Start from scratch</div>
                  <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>Manually check off what you have</div>
                </button>
              </div>
              <div style={{display:'flex',gap:8,marginTop:16}}>
                <button style={{...bBtn('ghost'),flex:1}} onClick={()=>setWizardStep(3)}>← Back</button>
              </div>
            </div>)}
            {wizardStep===5&&(<div>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:6}}>🧺 Pantry Checklist</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:12}}>Check off what you have on hand:</div>
              <div style={{maxHeight:320,overflowY:'auto',marginBottom:12}}>
                {pantryChecklist.map((item,idx)=>(
                  <div key={idx} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 4px',borderBottom:'1px solid '+C.border}}>
                    <input type='checkbox' checked={item.checked} onChange={e=>{
                      const updated=[...pantryChecklist];
                      updated[idx]={...updated[idx],checked:e.target.checked};
                      setPantryChecklist(updated);
                    }} style={{width:18,height:18,cursor:'pointer'}}/>
                    <span style={{fontFamily:FM,fontSize:14,color:C.text}}>{item.name}</span>
                    <span style={{fontFamily:FM,fontSize:11,color:C.muted,marginLeft:'auto'}}>{item.category}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button style={{...bBtn('ghost'),flex:1}} onClick={()=>setWizardStep(4)}>← Back</button>
                <button style={{...bBtn('primary'),flex:2}} onClick={()=>{
                  const checked=pantryChecklist.filter(i=>i.checked).map(i=>i.name);
                  if(checked.length>0){
                    const newItems=checked.map(name=>({id:Date.now()+Math.random(),name,quantity:1,unit:'item',category:pantryChecklist.find(p=>p.name===name)?.category||'Pantry',addedDate:new Date().toISOString().split('T')[0]}));
                    setInventory(prev=>[...prev,...newItems.filter(ni=>!prev.some(p=>p.name===ni.name))]);
                  }
                  completeWizard();
                }}>🎉 Finish Setup ({pantryChecklist.filter(i=>i.checked).length} items)</button>
              </div>
            </div>)}
          </div>
        </div>
      )}
      {showInstallBanner&&(<div style={{background:"#1a1f35",borderBottom:"2px solid "+C.accent,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>📱</span><div><div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.accent}}>Install Smart Kitchen on your phone</div><div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:2}}>{/iPhone|iPad|iPod/.test(navigator.userAgent)?"Tap Share then Add to Home Screen":"Tap menu then Add to Home Screen"}</div></div></div><button onClick={dismissInstall} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:8,color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:11,padding:"5px 10px"}}>Got it</button></div>)}
      {seniorMode&&<div style={{background:"#1a2e3a",borderBottom:"2px solid #60a5fa",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontFamily:"system-ui",fontSize:18,color:"#93c5fd",fontWeight:700}}>👴 Senior Mode Active</span><button onClick={()=>setSeniorMode(false)} style={{background:"transparent",border:"2px solid #60a5fa",borderRadius:8,color:"#93c5fd",cursor:"pointer",fontFamily:"system-ui",fontSize:16,padding:"8px 18px",fontWeight:600}}>Turn Off</button></div>}
      {showInventoryReminder&&(
        <div style={{background:"#1a2e1a",borderBottom:"2px solid #22c55e",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>📦</span>
            <div>
              <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:"#22c55e"}}>{new Date().getDay()===0?"Sunday":"Wednesday"} Inventory Check</div>
              <div style={{fontFamily:FM,fontSize:11,color:"#86efac",marginTop:2}}>Take a moment to verify your inventory is accurate — scan new items or adjust quantities.</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>{dismissReminder();setTab("inventory");}} style={{background:"#22c55e",border:"none",borderRadius:8,color:"#0a0a0a",cursor:"pointer",fontFamily:FM,fontSize:11,fontWeight:600,padding:"5px 12px"}}>✅ Review Now</button>
            <button onClick={dismissReminder} style={{background:"transparent",border:"1px solid #22c55e44",borderRadius:8,color:"#86efac",cursor:"pointer",fontFamily:FM,fontSize:11,padding:"5px 10px"}}>Dismiss</button>
          </div>
        </div>
      )}
      {/* -- Header -- */}
      <div style={{background:C.surface,borderBottom:"1px solid "+C.border,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:FD,fontSize:26,color:C.accent,lineHeight:1}}>Smart Kitchen</div>
          <div style={{fontSize:11,color:C.muted,marginTop:3,fontFamily:FM}}>
            {totalPortions} protein portions · {blendItem?.qty||0} blend bags · {inventory.length} items
            {restrictedProfiles.length>0&&<span style={{...bTag("#f472b6"),marginLeft:8,fontSize:9}}>⚕️ dietary restrictions active</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button style={bBtn("ghost")} onClick={()=>setProfileModalOpen(true)}>👨‍👩‍👧 Family</button>
          <button style={{...bBtn(seniorMode?"primary":"ghost"),fontSize:11,padding:"7px 10px"}} onClick={()=>setSeniorMode(m=>!m)}>{seniorMode?"🔤 ON":"🔤 Senior"}</button>
          <button style={bBtn("ghost")} onClick={()=>openRepack("veg")}>🫕 Prep Veg</button>
          <button style={bBtn("orange")} onClick={()=>openRepack("protein")}>🥩 Repackage</button>
          <button style={bBtn("ghost")} onClick={()=>{setScanOpen(true);setScanStage("upload");setScanResults(null);setScanPreview(null);setScanB64(null);setScanMode("shelf");}}>📷 Scan</button>
          <button style={bBtn("primary")} onClick={fetchRecipes}>✨ Recipes</button>
          <button style={{...bBtn("ghost"),fontSize:16,padding:"7px 10px"}} onClick={()=>setShowSettings(true)}>Settings</button>
        </div>
      </div>

      {/* -- Tabs -- */}
      <div style={{display:"flex",background:C.surface,borderBottom:"1px solid "+C.border,paddingLeft:12,overflowX:"auto"}}>
        {[["inventory","📦","Inventory"],["recipes","🍽","Recipes"],["mealplan","📅","Meal Plan"],["shopping","🛒","Shopping"],["desserts","🍰","Desserts"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"transparent",border:"none",borderBottom:"2px solid "+(tab===k?C.accent:"transparent"),padding:"11px 16px",color:tab===k?C.accent:C.muted,cursor:"pointer",fontFamily:FM,fontSize:seniorMode?18:11,fontWeight:700,letterSpacing:0.5,whiteSpace:"nowrap",transition:"all 0.15s",padding:seniorMode?"16px 22px":"11px 16px"}}>
            {ic} {lb.toUpperCase()}
          </button>
        ))}
      </div>

      {/* -- Content -- */}
      <div style={{padding:"20px",maxWidth:940,margin:"0 auto",fontSize:seniorMode?"22px":"14px"}}>
        {loading&&<div style={{textAlign:"center",padding:80}}><div style={{fontFamily:FD,fontSize:28,color:C.accent,marginBottom:12}}>{loadMsg}</div><LoadingDots/><div style={{fontSize:11,color:C.dim,fontFamily:FM,marginTop:10}}>this may take 10–20 seconds</div></div>}
        {/* == INVENTORY == */}
        {!loading&&tab==="inventory"&&(
          <div>
            {/* Freezer summary */}
            <div style={{background:"#111827",border:"1px solid "+C.borderLight,borderRadius:12,padding:"14px 18px",marginBottom:18,display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:16,alignItems:"start"}}>
              <div>
                <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginBottom:8,letterSpacing:0.8}}>🥩 PROTEIN PORTIONS</div>
                {proteinItems.length===0?<div style={{fontSize:12,color:C.dim}}>None</div>:proteinItems.map(i=>(
                  <div key={i.id} style={{fontSize:13,marginBottom:3,display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:C.text,fontWeight:600}}>{i.name}</span>
                    <span style={bTag(i.qty===0?C.red:C.green)}>{i.qty} portions</span>
                    <span style={{color:C.muted,fontSize:10,fontFamily:FM}}>{i.portionOz}oz ea</span>
                  </div>
                ))}
              </div>
              <div style={{width:1,background:C.border,alignSelf:"stretch"}}/>
              <div>
                <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginBottom:8,letterSpacing:0.8}}>🫕 MIXED SAUTÉ BLEND</div>
                {blendItem?(
                  <div>
                    <span style={bTag(blendItem.qty===0?C.red:C.orange)}>{blendItem.qty} × 2-cup bags</span>
                    <div style={{fontSize:11,color:C.muted,marginTop:4}}>{blendItem.blendNote}</div>
                    <div style={{fontSize:11,color:C.muted}}>≈ {blendItem.qty} dinners</div>
                  </div>
                ):<div style={{fontSize:12,color:C.dim}}>None logged</div>}
              </div>
            </div>

            {/* Filters */}
            <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              {["All",...LOCATIONS].map(l=>(
                <button key={l} onClick={()=>setFilterLoc(l)} style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11,background:filterLoc===l?(LOC_COLORS[l]||C.accent)+"22":"transparent",color:filterLoc===l?(LOC_COLORS[l]||C.accent):C.muted,border:"1px solid "+(filterLoc===l?(LOC_COLORS[l]||C.accent):C.border)}}>
                  {l!=="All"?LOC_ICONS[l]+" ":""}{l}
                </button>
              ))}
              <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...bInp,width:"auto",padding:"7px 12px",fontSize:11}}>
                <option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
              <button style={bBtn("ghost")} onClick={()=>setShowAdd(v=>!v)}>{showAdd?"✕ Cancel":"+ Add"}</button>
            </div>

            {showAdd&&(
              <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:14,marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:8,alignItems:"end",marginBottom:10}}>
                  {[{l:"Name",k:"name",ph:"Item name"},{l:"Qty",k:"qty",ph:"1",t:"number"},{l:"Unit",k:"unit",ph:"cup"}].map(f=>(
                    <div key={f.k}><Label>{f.l}</Label><input style={bInp} placeholder={f.ph} type={f.t||"text"} value={newItem[f.k]} onChange={e=>setNewItem(p=>({...p,[f.k]:e.target.value}))}/></div>
                  ))}
                  <button style={{...bBtn("primary"),whiteSpace:"nowrap",alignSelf:"flex-end"}} onClick={addItem}>Add</button>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontFamily:FM,fontSize:11,color:C.muted,marginRight:2}}>Category:</span>
                  {[["Protein","#ef4444"],["Produce","#22c55e"],["Dairy","#60a5fa"],["Frozen","#a78bfa"],["Pantry","#f59e0b"],["Baking","#f472b6"],["Grains","#d97706"],["Condiments","#94a3b8"],["Other","#6b7280"]].map(([cat,col])=>(
                    <button key={cat} onClick={()=>{const autoLoc=cat==="Protein"?"Freezer":cat==="Dairy"||cat==="Produce"?"Fridge":cat==="Frozen"?"Freezer":newItem.location;setNewItem(p=>({...p,category:cat,location:autoLoc}));}} style={{padding:"4px 10px",borderRadius:20,border:"2px solid "+(newItem.category===cat?col:"transparent"),background:newItem.category===cat?col+"22":"transparent",color:newItem.category===cat?col:C.muted,fontFamily:FM,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>{cat}</button>
                  ))}
                  <span style={{marginLeft:"auto",fontFamily:FM,fontSize:11,color:C.muted,whiteSpace:"nowrap",paddingLeft:8}}>📍 Location:</span>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {["Freezer","Fridge","Pantry"].map(loc=>(
                      <button key={loc} onClick={()=>setNewItem(p=>({...p,location:loc}))} style={{padding:"4px 10px",borderRadius:20,border:"2px solid "+(newItem.location===loc?C.accent:"transparent"),background:newItem.location===loc?C.accent+"22":"transparent",color:newItem.location===loc?C.accent:C.muted,fontFamily:FM,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{loc}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:9}}>
              {filtered.map(item=>{
                const isBP=item.isBulkProtein;
                const isDV=item.isDicedVeg;
                return(
                  <div key={item.id} style={{background:C.card,border:"1px solid "+item.isLow?C.red:C.border,borderRadius:12,padding:13,display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:seniorMode?22:13,lineHeight:1.4}}>{item.name}</div>
                        {item.blendNote&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>{item.blendNote}</div>}
                        {item.isLow&&<div style={bTag(C.red)}>⚠️ Low</div>}
                      </div>
                      <button onClick={()=>setInventory(p=>p.filter(i=>i.id!==item.id))} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:14,padding:2}}>✕</button>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                      <select value={item.category} onChange={e=>{const cat=e.target.value;const autoLoc=cat==="Protein"?"Freezer":cat==="Dairy"||cat==="Produce"?"Fridge":cat==="Frozen"?"Freezer":cat==="Baking"?"Pantry":item.location;setInventory(p=>p.map(i=>i.id===item.id?{...i,category:cat,location:autoLoc}:i));}} onClick={e=>e.stopPropagation()} style={{fontSize:11,fontWeight:600,padding:"2px 4px",borderRadius:8,border:"1px solid "+(CAT_COLORS[item.category]||C.muted)+"88",background:(CAT_COLORS[item.category]||C.muted)+"22",color:CAT_COLORS[item.category]||C.muted,cursor:"pointer",maxWidth:100}}>
                        {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={item.location||"Pantry"} onChange={e=>setInventory(p=>p.map(i=>i.id===item.id?{...i,location:e.target.value}:i))} onClick={e=>e.stopPropagation()} style={{fontSize:11,fontWeight:600,padding:"2px 4px",borderRadius:8,border:"1px solid "+(LOC_COLORS[item.location]||C.muted)+"88",background:(LOC_COLORS[item.location]||C.muted)+"22",color:LOC_COLORS[item.location]||C.muted,cursor:"pointer"}}>
                        {["Freezer","Fridge","Pantry"].map(l=><option key={l} value={l}>{LOC_ICONS[l]} {l}</option>)}
                      </select>
                      {isBP&&<span style={bTag(C.red)}>{item.portionOz}oz</span>}
                      {isDV&&<span style={bTag(C.orange)}>{item.cupsPerBag}c bag</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={()=>setInventory(p=>p.map(i=>i.id===item.id?{...i,qty:Math.max(0,i.qty-1)}:i))} style={{width:seniorMode?52:24,height:seniorMode?52:24,borderRadius:8,background:C.surface,border:"2px solid "+C.border,color:C.text,cursor:"pointer",fontSize:seniorMode?26:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{fontFamily:FM,fontSize:13,minWidth:56,textAlign:"center",color:item.qty===0?C.red:C.text}}>{item.qty} <span style={{fontSize:10,color:C.muted}}>{item.unit}</span></span>
                      <button onClick={()=>setInventory(p=>p.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i))} style={{width:seniorMode?52:24,height:seniorMode?52:24,borderRadius:8,background:C.surface,border:"2px solid "+C.border,color:C.text,cursor:"pointer",fontSize:seniorMode?26:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      {item.qty===0&&<span style={bTag(C.red)}>OUT</span>}
                    </div>
                    {(isBP||isDV)&&<button onClick={()=>openRepack(isBP?"protein":"veg")} style={{...bBtn("ghost"),padding:"4px 8px",fontSize:10,width:"100%"}}>{isBP?"🥩 Add Batch":"🫕 Prep More"}</button>}
                    <button onClick={()=>setRestockQueue(q=>{const n=item.name;const has=q.includes(n);const next=has?q.filter(x=>x!==n):[...q,n];localStorage.setItem("sk_restockQueue",JSON.stringify(next));return next;})} style={{...bBtn("ghost"),padding:"4px 8px",fontSize:10,width:"100%",marginTop:4,border:"1px solid "+(restockQueue.includes(item.name)?C.accent:C.border),color:restockQueue.includes(item.name)?C.accent:C.muted}}>{restockQueue.includes(item.name)?"Queued":"+ Restock"}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* == RECIPES == */}
        {!loading&&tab==="recipes"&&(
          <div>
            {(hasNoWhiteRice||hasNoRegularPasta||hasZeroSugar)&&(
              <div style={{background:"#f472b6"+"15",border:"1px solid #f472b644",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
                <div style={{fontSize:11,fontFamily:FM,color:"#f472b6",marginBottom:4}}>⚕️ DIETARY RESTRICTIONS ACTIVE</div>
                <div style={{fontSize:12,color:C.muted}}>
                  {hasNoWhiteRice&&<span style={{marginRight:12}}>🚫 Brown rice only</span>}
                  {hasNoRegularPasta&&<span style={{marginRight:12}}>🚫 Whole wheat pasta only</span>}
                  {hasZeroSugar&&<span>🚫 Zero sugar</span>}
                </div>
              </div>
            )}
            {recipes.length===0?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{fontFamily:FD,fontSize:48,color:C.accent,marginBottom:16}}>🍽</div>
                {recipeError&&<div style={{color:C.red,fontFamily:FM,fontSize:12,marginBottom:14,background:C.red+"15",padding:"10px 16px",borderRadius:8}}>{recipeError}</div>}
                <div style={{color:C.muted,marginBottom:20}}>AI suggests dinners built around your freezer preps</div>
                <button style={bBtn("primary")} onClick={fetchRecipes}>✨ Suggest Recipes</button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontFamily:FD,fontSize:22}}>Recipe Suggestions</div>
                  <button style={bBtn("ghost")} onClick={fetchRecipes}>🔄 Refresh</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
                  {recipes.map(r=>(
                    <div key={r.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.15s"}}
                      onClick={()=>setActiveRecipe(r)}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.cardHover;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"flex-start"}}>
                        <div style={{fontFamily:FD,fontSize:seniorMode?26:19,lineHeight:1.3,flex:1}}><a href={getRecipeUrl(r.name)} target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:"none"}}>🔍 {r.name}</a></div>
                        <span style={{...bTag(r.difficulty==="Easy"?C.green:r.difficulty==="Hard"?C.red:C.accent),marginLeft:8}}>{r.difficulty}</span>
                      </div>
                      <div style={{color:C.muted,fontSize:seniorMode?17:13,marginBottom:12,lineHeight:1.6}}>{r.description}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        <span style={{...bTag(C.muted),fontSize:seniorMode?14:undefined}}>⏱ {r.time}</span>
                        <span style={bTag(C.blue)}>👨‍👩‍👧 {activeProfiles.length} people</span>
                        <span style={{...bTag(C.green),fontSize:seniorMode?14:undefined}}>✅ {(r.usesFromInventory||[]).length} on hand</span>
                        {(r.missingIngredients||[]).length>0&&<span style={{...bTag(C.red),fontSize:seniorMode?14:undefined}}>🛒 {r.missingIngredients.length} needed</span>}
                      </div>
                      <div style={{fontSize:seniorMode?17:11,color:C.accent,fontFamily:FM,fontWeight:seniorMode?700:400}}>TAP FOR FULL RECIPE →</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* == MEAL PLAN == */}
        {!loading&&tab==="mealplan"&&(
          <div>
            {saleItems.length>0&&(
              <div style={{background:"#1a1500",border:"1px solid #f59e0b",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontFamily:FD,fontSize:14,color:"#f59e0b"}}>🏷️ {saleItems.length} Meijer Sale Items Loaded</div>
                  <div style={{fontFamily:FM,fontSize:11,color:"#fbbf24",marginTop:2}}>{saleItems.slice(0,4).map(i=>i.name).join(", ")}{saleItems.length>4?" + "+(saleItems.length-4)+" more":""}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{...bBtn("ghost"),fontSize:11,padding:"6px 12px",border:"1px solid #f59e0b44",color:"#f59e0b"}} onClick={()=>setSaleItems([])}>✕ Clear</button>
                  <button style={{padding:"8px 16px",borderRadius:9,border:"none",background:"#f59e0b",color:"#0c0e14",fontFamily:FM,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={buildSaleMealPlan}>🏷️ Build Sale Meal Plan</button>
                </div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <div style={{fontFamily:FD,fontSize:24}}>7-Day Dinner Plan <span style={{fontSize:13,color:C.muted,fontFamily:FB}}>· {activeProfiles.length} people</span></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button style={bBtn("ghost")} onClick={buildMealPlan}>🔄 Regenerate</button>
                {mealPlan.length>0&&<><button style={bBtn("ghost")} onClick={printMealPlan}>🖨 Print</button><button style={bBtn("ghost")} onClick={pushToCalendar}>📅 Calendar</button><button style={bBtn("primary")} onClick={genShopping}>🛒 Shopping List</button></>}
              </div>
            </div>
            {mealPlan.length===0?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{fontFamily:FD,fontSize:48,color:C.accent,marginBottom:16}}>📅</div>
                <div style={{color:C.muted,marginBottom:20}}>Builds around your protein portions and sauté blend bags</div>
                <button style={bBtn("primary")} onClick={buildMealPlan}>📅 Build Meal Plan</button>
              </div>
            ):(
              <div>
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 16px",marginBottom:12,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginRight:4}}>THIS WEEK:</div>
                  {mealPlan.filter(d=>d.proteinUsed).map((d,i)=>(
                    <span key={i} style={bTag(PROTEIN_TAG_COLOR(d.proteinUsed))}>{d.day?.slice(0,3)} · {d.proteinUsed}</span>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {mealPlan.map((day,i)=>(
                    <div key={i} style={{background:day.quickMeal?"#1a1a2e":C.card,border:"1px solid "+(day.quickMeal?"#f59e0b":C.border),borderRadius:12,padding:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{fontWeight:700,color:C.accent,fontSize:seniorMode?20:17,fontFamily:FD}}>{day.day}</div>
                          <div style={{fontFamily:FM,fontSize:9,color:C.muted}}>DAY {i+1}</div>
                        </div>
                        <button onClick={()=>day.quickMeal?clearQuickMeal(i):quickMealForDay(i)} style={{background:day.quickMeal?"#f59e0b22":"transparent",border:"1px solid "+(day.quickMeal?"#f59e0b":C.border),borderRadius:6,color:day.quickMeal?"#f59e0b":C.muted,cursor:"pointer",fontFamily:FM,fontSize:10,padding:"3px 8px"}}>{day.quickMeal?"⚡ Busy Night":"⚡ Busy?"}</button>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        {day.quickMeal&&<span style={{fontSize:10,background:"#f59e0b22",color:"#f59e0b",padding:"2px 6px",borderRadius:4,fontFamily:FM,display:"inline-block",marginBottom:4}}>⚡ BUSY NIGHT — under 20 min</span>}
                        <div><div onClick={()=>openMealPlanRecipe(day)} style={{fontFamily:FD,fontSize:seniorMode?15:14,marginBottom:4,color:C.accent,cursor:"pointer",lineHeight:1.4}}>🔍 {day.meal}</div><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:day.ingredients&&day.ingredients.length>0?6:0}}><span onClick={()=>openMealPlanRecipe(day)} style={{fontSize:seniorMode?13:11,color:"#f59e0b",fontFamily:FM,cursor:"pointer",letterSpacing:0.3,fontWeight:700,whiteSpace:"nowrap"}}>TAP FOR FULL RECIPE →</span><a href={getRecipeUrl(day.meal)} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#60a5fa",fontFamily:FM,textDecoration:"none",fontWeight:600}}>🌐 web</a></div>{day.ingredients&&day.ingredients.length>0&&<div style={{marginTop:6,padding:"8px 10px",background:"rgba(255,255,255,0.05)",borderRadius:6,fontSize:11,fontFamily:FM}}><div style={{fontWeight:600,marginBottom:4,color:C.muted}}>INGREDIENTS</div>{day.ingredients.map((ing,ii)=><div key={ii} style={{color:C.text,marginBottom:2}}>· {ing}</div>)}</div>}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {day.proteinUsed&&<span style={bTag(PROTEIN_TAG_COLOR(day.proteinUsed))}>🥩 {day.proteinUsed}</span>}
                          {(day.sauteBagsUsed||0)>0&&<span style={bTag(C.orange)}>🫕 {day.sauteBagsUsed} bag</span>}
                          {day.sideUsed&&<span style={bTag(C.green)}>🥦 {day.sideUsed}</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        {(day.shoppingNeeded||[]).length===0
                          ?<span style={bTag(C.green)}>✅ Ready</span>
                          :<div style={{width:"100%",marginBottom:4}}><div style={{fontSize:9,color:C.muted,marginBottom:3,fontFamily:FM}}>NEED</div>{(day.shoppingNeeded||[]).map((s,j)=><div key={j} style={{fontSize:seniorMode?13:11,color:C.red,marginBottom:2}}>· {s.qty} {s.unit} {s.name}</div>)}</div>}
                        <button onClick={()=>madeMeal(day)} style={{background:"#3ecf8e22",border:"1px solid #3ecf8e44",borderRadius:6,color:"#3ecf8e",cursor:"pointer",fontFamily:FM,fontSize:seniorMode?14:11,padding:"8px 14px",flexShrink:0}}>✅ Made It!</button>
                        <button onClick={()=>{setChangeMealModal(i);setChangeMealRequest("");}} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:4,color:C.muted,fontFamily:FM,fontSize:seniorMode?14:11,padding:"8px 14px",cursor:"pointer",flexShrink:0}}>🔄 Change Meal</button>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {changeMealModal!==null&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setChangeMealModal(null)}><div style={{background:C.card,borderRadius:12,padding:24,width:360,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:C.text,marginBottom:16}}>🔄 Change {mealPlan[changeMealModal]?.day} Meal</div><div style={{marginBottom:16}}><button onClick={async()=>{setChangeMealLoading(true);const day=mealPlan[changeMealModal];const prompt=`Suggest a different dinner meal for ${day.day}. Current meal was: ${day.meal}. INVENTORY (items already owned — do NOT put these in needToBuy): ${inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")}. STRICT RULE: needToBuy must contain ONLY ingredients required for this meal that are NOT in the inventory list above. If an ingredient appears in inventory, it must NOT appear in needToBuy. Cross-check every needToBuy item against inventory before returning. Return JSON: {meal,ingredients:[],needToBuy:[],proteinUsed:"",sauteBagsUsed:0,quickMeal:false}.`;const res=await callClaude({system:"Meal planning AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{console.log("changeMeal res:",JSON.stringify(res));const resText=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||res?.[0]?.text||"";const raw=resText.replace(/```json|```/g,"").trim();console.log("raw:",raw);const s=raw.indexOf("{"),e=raw.lastIndexOf("}");const parsed=JSON.parse(raw.slice(s,e+1));setMealPlan(p=>p.map((d,i)=>i===changeMealModal?{...d,...parsed,needToBuy:parsed.needToBuy||[],shoppingNeeded:(parsed.needToBuy||[]).map(n=>typeof n==="string"?{qty:1,unit:"",name:n}:n),ingredients:parsed.ingredients||[]}:d));setChangeMealModal(null);}catch(err){console.error("Parse error:",err);alert("Could not parse meal suggestion");}setChangeMealLoading(false);}} style={{width:"100%",padding:"10px",background:C.accent,border:"none",borderRadius:8,color:"#000",fontFamily:FM,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:10}}>✨ {changeMealLoading?"Thinking...":"Surprise Me"}</button><div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:8}}>— or request a specific meal —</div><input style={{width:"100%",padding:"8px",background:"#1e1e1e",border:"1px solid "+C.border,borderRadius:6,color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box",marginBottom:10}} placeholder='e.g. "Goulash"' value={changeMealRequest} onChange={e=>setChangeMealRequest(e.target.value)} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} /><button onClick={async()=>{if(!changeMealRequest.trim())return;setChangeMealLoading(true);const day=mealPlan[changeMealModal];const prompt=`Create a dinner meal for ${day.day} using "${changeMealRequest}". INVENTORY (items already owned — do NOT put these in needToBuy): ${inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")}. STRICT RULE: needToBuy must contain ONLY ingredients required for this meal that are NOT in the inventory list above. If an ingredient appears in inventory, it must NOT appear in needToBuy. Cross-check every needToBuy item against inventory before returning. Return JSON: {meal,ingredients:[],needToBuy:[],proteinUsed:"",sauteBagsUsed:0,quickMeal:false}.`;const res=await callClaude({system:"Meal planning AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{const resText3=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||res?.[0]?.text||"";const raw=resText3;const s=raw.indexOf("{"),e=raw.lastIndexOf("}");const parsed=JSON.parse(raw.slice(s,e+1));setMealPlan(p=>p.map((d,i)=>i===changeMealModal?{...d,...parsed,needToBuy:parsed.needToBuy||[],shoppingNeeded:(parsed.needToBuy||[]).map(n=>typeof n==="string"?{qty:1,unit:"",name:n}:n),ingredients:parsed.ingredients||[]}:d));setChangeMealModal(null);}catch(e){alert("Could not parse meal suggestion");}setChangeMealLoading(false);}} style={{width:"100%",padding:"10px",background:"transparent",border:"1px solid "+C.accent,borderRadius:8,color:C.accent,fontFamily:FM,fontSize:13,cursor:"pointer"}}>🍽️ {changeMealLoading?"Thinking...":"Make This Meal"}</button></div><button onClick={()=>setChangeMealModal(null)} style={{width:"100%",padding:"8px",background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer"}}>Cancel</button></div></div>}
{/* == SHOPPING == */}
        {!loading&&tab==="shopping"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:FD,fontSize:24}}>Shopping List</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {shopping.length>0&&<><div style={{fontFamily:FM,fontSize:11,color:C.muted}}>{shopping.filter(i=>i.checked).length}/{shopping.length}</div><button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11}} onClick={printShopping}>🖨 Print</button>{shopPartnerEmail&&<button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11}} onClick={()=>{const grouped={}; shopping.forEach(i=>{const cat=i.category||"Other"; if(!grouped[cat])grouped[cat]=[];grouped[cat].push((i.qty||1)+" "+(i.unit||"")+" "+i.name);});const body=Object.entries(grouped).map(([cat,items])=>cat+"%0A"+items.map(i=>"  - "+i).join("%0A")).join("%0A%0A");const subject="Shopping List - Smart Kitchen";window.open("mailto:"+shopPartnerEmail+"?subject="+subject+"&body="+body);}}>Email to {shopPartnerName||shopPartnerEmail}</button>}{restockQueue.length>0&&<button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11,border:"1px solid "+C.accent,color:C.accent}} onClick={()=>{const toAdd=restockQueue.filter(name=>!shopping.some(s=>s.name.toLowerCase()===name.toLowerCase())).map(name=>({name,qty:1,unit:"",category:"Pantry",checked:false,suggestBulk:false}));setShopping(p=>[...p,...toAdd]);alert(restockQueue.length+" restock items added to list.");}}>+ {restockQueue.length} Restock</button>}</>}
              </div>
            </div>
            {shopping.length===0?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{fontFamily:FD,fontSize:48,color:C.accent,marginBottom:16}}>🛒</div>
                <div style={{color:C.muted,marginBottom:20}}>{mealPlan.length===0?"Build a meal plan first":"Generate your list from the meal plan"}</div>
                {mealPlan.length>0?<button style={bBtn("primary")} onClick={genShopping}>🛒 Generate</button>:<button style={bBtn("ghost")} onClick={()=>setTab("mealplan")}>→ Meal Plan</button>}
              </div>
            ):(
              <div>
                {CATEGORIES.filter(cat=>shopping.some(i=>i.category===cat)).map(cat=>(
                  <div key={cat} style={{marginBottom:18}}>
                    <div style={{fontFamily:FM,fontSize:10,color:CAT_COLORS[cat]||C.muted,letterSpacing:1.2,marginBottom:7,display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:CAT_COLORS[cat]||C.muted}}/>{cat.toUpperCase()}
                    </div>
                    {shopping.filter(i=>i.category===cat).map((item)=>{
                      const gi=shopping.indexOf(item);
                      return(
                        <div key={gi} onClick={()=>setShopping(p=>p.map((si,sii)=>sii===gi?{...si,checked:!si.checked}:si))}
                          style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"center",gap:12,cursor:"pointer",opacity:item.checked?0.45:1,transition:"opacity 0.2s"}}>
                          <div style={{width:18,height:18,borderRadius:4,border:"2px solid "+item.checked?C.green:C.border,background:item.checked?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>{item.checked&&"✓"}</div>
                          <div style={{flex:1,fontSize:13,textDecoration:item.checked?"line-through":"none"}}>{item.name}</div>
                          {item.suggestBulk&&<span style={bTag(C.orange)}>📦 bulk</span>}
                          <div style={{fontFamily:FM,fontSize:12,color:C.muted}}>{item.qty} {item.unit}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <button style={bBtn("green")} onClick={()=>{
                  const checked=shopping.filter(i=>i.checked);
                  setInventory(prev=>{const u=[...prev];checked.forEach(si=>{const idx=u.findIndex(i=>i.name.toLowerCase()===si.name.toLowerCase());if(idx>=0){u[idx]={...u[idx],qty:+(u[idx].qty+(si.qty||1)).toFixed(1)};}else{u.push({id:Date.now()+Math.random(),name:si.name,qty:si.qty||1,unit:si.unit,category:si.category,location:"Pantry"});}});return u;});
                  setShopping(p=>p.filter(i=>!i.checked));
                  alert("✅ Items restocked!");
                }}>✅ Restock Checked Items</button>
              </div>
            )}
          </div>
        )}

        {/* == DESSERTS == */}
        {tab==="desserts"&&(
          <div>
            <div style={{background:"#1a1510",border:"1px solid "+C.accent+"44",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontSize:10,fontFamily:FM,color:C.accent,letterSpacing:0.8}}>🧁 BAKING PANTRY:</div>
              {[...new Set([...inventory.filter(i=>i.category==="Baking"||i.category==="Spices").map(i=>i.name),...["Brownie Mixes","Muffin Mixes","Pie Crusts","Puff Pastry","Crescent Dough","Cream Cheese","Condensed Milk","Pie Fillings","Flour","Sugar","Vanilla","Butter","Eggs"].filter(name=>inventory.some(i=>i.name.toLowerCase().includes(name.toLowerCase())))])].map(i=>(
                <span key={i} style={bTag(C.accent)}>{i}</span>
              ))}
            </div>
            {dessertLoading?(
              <div style={{textAlign:"center",padding:60}}><div style={{fontFamily:FD,fontSize:28,color:C.accent,marginBottom:12}}>Raiding the dessert pantry…</div><LoadingDots/></div>
            ):dessertError?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{color:C.red,fontFamily:FM,fontSize:13,marginBottom:16}}>{dessertError}</div>
                <button style={bBtn("primary")} onClick={fetchDesserts}>Try Again</button>
              </div>
            ):desserts.length===0?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{fontFamily:FD,fontSize:48,marginBottom:16}}>🍰</div>
                <div style={{fontFamily:FD,fontSize:22,color:C.accent,marginBottom:10}}>What's for Dessert?</div>
                <div style={{color:C.muted,marginBottom:20}}>Let AI suggest treats from your baking pantry</div>
                <button style={{...bBtn("primary"),padding:"12px 28px"}} onClick={fetchDesserts}>🍰 Suggest Desserts</button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontFamily:FD,fontSize:22}}>Desserts & Sweet Treats</div>
                  <button style={bBtn("ghost")} onClick={fetchDesserts}>🔄 New Suggestions</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
                  {desserts.map(d=>(
                    <div key={d.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.15s"}}
                      onClick={()=>setActiveDessert(d)}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.cardHover;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontFamily:FD,fontSize:19,lineHeight:1.3,flex:1}}>{d.name}</div>
                        <span style={{...bTag(d.difficulty==="Easy"?C.green:d.difficulty==="Hard"?C.red:C.accent),marginLeft:8}}>{d.difficulty}</span>
                      </div>
                      <div style={{color:C.muted,fontSize:13,marginBottom:12,lineHeight:1.5}}>{d.description}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        <span style={bTag(C.muted)}>⏱ {d.time}</span>
                        <span style={bTag("#f472b6")}>{d.category}</span>
                        {d.servings&&<span style={bTag(C.blue)}>🍽 {d.servings} servings</span>}
                        {(d.usesFromInventory||[]).length>0&&<span style={bTag(C.green)}>✅ {d.usesFromInventory.length} on hand</span>}
                        {(d.missingIngredients||[]).length>0&&<span style={bTag(C.red)}>🛒 {d.missingIngredients.length} needed</span>}
                      </div>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:11,color:C.accent,fontFamily:FM,letterSpacing:0.5}}>TAP FOR RECIPE →</span>
                        <a href={getRecipeUrl(d.name)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:10,color:"#60a5fa",fontFamily:FM,textDecoration:"none",fontWeight:600}}>🌐 web</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* == FAMILY PROFILES MODAL == */}
      {profileModalOpen&&(
        <div style={{position:"fixed",inset:0,background:"#000d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>setProfileModalOpen(false)}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:18,padding:22,maxWidth:600,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div>
                <div style={{fontFamily:FD,fontSize:24,color:C.accent}}>👨‍👩‍👧 Family Profiles</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:FM,marginTop:3}}>Meal plans adapt to each person's needs</div>
              </div>
              <button onClick={()=>setProfileModalOpen(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>

            {/* Family size */}
            <div style={{background:C.card,borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginBottom:8,letterSpacing:0.8}}>FAMILY SIZE</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8].map(n=>(
                  <button key={n} onClick={()=>{setFamilySize(n);setFamilyProfiles(p=>p.map((pr,i)=>({...pr,active:i<n})));}}
                    style={{width:38,height:38,borderRadius:8,border:"1px solid "+(familySize===n?C.accent:C.border),background:familySize===n?C.accent+"22":"transparent",color:familySize===n?C.accent:C.muted,cursor:"pointer",fontFamily:FM,fontSize:14,fontWeight:600}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile cards */}
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {familyProfiles.filter(p=>p.active).map((profile,idx)=>{
                const preset=RESTRICTION_PRESETS[profile.restriction]||RESTRICTION_PRESETS.standard;
                const isEditing=editingProfile===profile.id;
                return(
                  <div key={profile.id} style={{background:C.card,border:"1px solid "+isEditing?C.accent:C.border,borderRadius:12,padding:14,transition:"border-color 0.15s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isEditing?12:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:18}}>{preset.icon}</div>
                        <div>
                          <div style={{fontWeight:600,fontSize:14}}>{profile.name||"Person "+(idx+1)}</div>
                          <span style={bTag(preset.color)}>{preset.label}</span>
                        </div>
                      </div>
                      <button onClick={()=>setEditingProfile(isEditing?null:profile.id)} style={{...bBtn("ghost"),padding:"5px 10px",fontSize:11}}>
                        {isEditing?"✓ Done":"✏️ Edit"}
                      </button>
                    </div>
                    {isEditing&&(
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        <div><Label>NAME</Label><input style={bInp} placeholder={"Person "+(idx+1)} value={profile.name} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,name:e.target.value}:pr))}/></div>
                        <div>
                          <Label>ROLE</Label>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {Object.entries(ROLE_LABELS).map(([k,v])=>(
                              <button key={k} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,role:k}:pr))}
                                style={{...bBtn("ghost"),padding:"5px 10px",fontSize:11,background:profile.role===k?C.blue+"22":"transparent",color:profile.role===k?C.blue:C.muted,border:"1px solid "+(profile.role===k?C.blue:C.border)}}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>DIETARY RESTRICTION</Label>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {Object.entries(RESTRICTION_PRESETS).map(([k,r])=>(
                              <button key={k} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,restriction:k}:pr))}
                                style={{...bBtn("ghost"),padding:"5px 10px",fontSize:11,background:profile.restriction===k?r.color+"22":"transparent",color:profile.restriction===k?r.color:C.muted,border:"1px solid "+(profile.restriction===k?r.color:C.border)}}>
                                {r.icon} {r.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {(profile.restriction==="diabetic"||profile.restriction==="renal"||profile.restriction==="diabeticRenal"||profile.restriction==="heartHealthy"||profile.restriction==="lowSodium")&&(
                          <div style={{background:"#111827",borderRadius:10,padding:12}}>
                            <Label>CUSTOM PARAMETERS (from dietitian — leave blank for defaults)</Label>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                              {[
                                {label:"Carbs/Meal (g)",key:"carbsPerMeal",show:["diabetic","diabeticRenal"]},
                                {label:"Sodium/Day (mg)",key:"sodiumMg",show:["diabetic","renal","diabeticRenal","heartHealthy","lowSodium"]},
                                {label:"Potassium/Day (mg)",key:"potassiumMg",show:["renal","diabeticRenal"]},
                                {label:"Protein/Day (g)",key:"proteinG",show:["renal","diabeticRenal"]},
                                {label:"Phosphorus/Day (mg)",key:"phosphorusMg",show:["renal","diabeticRenal"]},
                              ].filter(f=>f.show.includes(profile.restriction)).map(field=>(
                                <div key={field.key}>
                                  <Label>{field.label}</Label>
                                  <input style={{...bInp,fontSize:12}} type="number" placeholder="dietitian value"
                                    value={profile.customParams?.[field.key]||""}
                                    onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,customParams:{...pr.customParams,[field.key]:e.target.value?parseFloat(e.target.value):undefined}}:pr))}/>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:20,borderTop:"1px solid "+C.border,paddingTop:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:FD,fontSize:16,color:"#a78bfa"}}>⚕️ Temporary Medical Diets</div>
                  <button style={{...bBtn("ghost"),fontSize:11,padding:"4px 10px",border:"1px solid #a78bfa",color:"#a78bfa"}} onClick={()=>setShowTempForm(f=>!f)}>+ Add</button>
                </div>
                {showTempForm&&(
                  <div style={{background:"#1a0a2e",borderRadius:10,padding:14,marginBottom:12,border:"1px solid #a78bfa44"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:3}}>PERSON</div><input style={bInp} placeholder="e.g. Rick" value={newTemp.name} onChange={e=>setNewTemp(p=>({...p,name:e.target.value}))}/></div>
                      <div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:3}}>REASON</div><input style={bInp} placeholder="e.g. Post-surgery" value={newTemp.reason} onChange={e=>setNewTemp(p=>({...p,reason:e.target.value}))}/></div>
                    </div>
                    <div style={{marginBottom:8}}><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:3}}>DIETARY RESTRICTION</div>
                      <select style={{...bInp,padding:"8px 10px"}} value={newTemp.restriction} onChange={e=>setNewTemp(p=>({...p,restriction:e.target.value}))}>
                        {Object.entries(RESTRICTION_PRESETS).map(([k,r])=><option key={k} value={k}>{r.icon} {r.label}</option>)}
                      </select>
                    </div>
                    <div style={{marginBottom:8}}><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:3}}>ADDITIONAL NOTES (optional)</div><input style={bInp} placeholder="e.g. soft foods only, no raw vegetables" value={newTemp.customNotes} onChange={e=>setNewTemp(p=>({...p,customNotes:e.target.value}))}/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                      <div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:3}}>START DATE</div><input type="date" style={bInp} value={newTemp.startDate} onChange={e=>setNewTemp(p=>({...p,startDate:e.target.value}))}/></div>
                      <div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:3}}>END DATE</div><input type="date" style={bInp} value={newTemp.endDate} onChange={e=>setNewTemp(p=>({...p,endDate:e.target.value}))}/></div>
                    </div>
                    <button style={{...bBtn("primary"),width:"100%",background:"#7c3aed"}} onClick={()=>{
                      if(!newTemp.name||!newTemp.reason){alert("Please enter a name and reason.");return;}
                      setTempProfiles(p=>[...p,{...newTemp,id:Date.now()}]);
                      setNewTemp({name:"",reason:"",restriction:"lowSodium",customNotes:"",startDate:new Date().toISOString().split("T")[0],endDate:"",duration:7});
                      setShowTempForm(false);
                    }}>⚕️ Save Temporary Diet</button>
                  </div>
                )}
                {tempProfiles.length===0&&!showTempForm&&<div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:C.muted,textAlign:"center",padding:"12px 0"}}>No temporary diets active</div>}
                {tempProfiles.map(t=>{
                  const isActive=t.startDate<=today&&(!t.endDate||t.endDate>=today);
                  const isExpired=t.endDate&&t.endDate<today;
                  const daysLeft=t.endDate?Math.ceil((new Date(t.endDate)-new Date(today))/(1000*60*60*24)):null;
                  return(
                    <div key={t.id} style={{background:isExpired?"#1a1a1a":isActive?"#1a0a2e":"#0f0f1a",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+(isExpired?C.border:isActive?"#7c3aed44":C.border+"44")}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div>
                          <div style={{fontFamily:FD,fontSize:13,color:isExpired?C.muted:isActive?"#a78bfa":C.muted}}>{RESTRICTION_PRESETS[t.restriction]?.icon} {t.name} — {t.reason}</div>
                          <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:2}}>{RESTRICTION_PRESETS[t.restriction]?.label}{t.customNotes?" · "+t.customNotes:""}</div>
                          <div style={{fontFamily:FM,fontSize:10,marginTop:4,color:isExpired?"#ef4444":daysLeft<=3?"#f59e0b":"#86efac"}}>{isExpired?"⚠ Expired "+t.endDate:isActive?daysLeft===null?"Active (no end date)":daysLeft<=3?"⚠ Ends in "+daysLeft+" day"+(daysLeft===1?"":"s"):"✅ Active until "+t.endDate:"Starts "+t.startDate}</div>
                        </div>
                        <button onClick={()=>setTempProfiles(p=>p.filter(x=>x.id!==t.id))} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            <button style={{...bBtn("primary"),width:"100%",marginTop:14,padding:12}} onClick={()=>setProfileModalOpen(false)}>✅ Save & Close</button>
          </div>
        </div>
      )}

      {/* == REPACKAGE MODAL == */}
      {rpOpen&&(
        <div style={{position:"fixed",inset:0,background:"#000d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>setRpOpen(false)}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:18,padding:22,maxWidth:560,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:FD,fontSize:22,color:C.accent}}>{rpMode==="protein"?"🥩 Repackage Protein":"🫕 Prep Sauté Blend Bags"}</div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>setRpMode("protein")} style={{...bBtn(rpMode==="protein"?"orange":"ghost"),padding:"6px 12px",fontSize:11}}>🥩</button>
                <button onClick={()=>setRpMode("veg")} style={{...bBtn(rpMode==="veg"?"teal":"ghost"),padding:"6px 12px",fontSize:11}}>🫕</button>
                <button onClick={()=>setRpOpen(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
              </div>
            </div>
            {rpMode==="protein"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div><Label>PROTEIN NAME</Label><input style={bInp} placeholder="e.g. Chicken Breast" value={rpPName} onChange={e=>{setRpPName(e.target.value);setRpPPreview(null);}}/></div>
                  <div><Label>WEIGHT (lbs)</Label><input style={bInp} type="number" placeholder="5" value={rpPLbs} onChange={e=>{setRpPLbs(e.target.value);setRpPPreview(null);}}/></div>
                  <div>
                    <Label>OZ PER PORTION</Label>
                    <div style={{display:"flex",gap:6}}>
                      {[4,5,6,7,8].map(oz=>(
                        <button key={oz} onClick={()=>{setRpPOz(oz);setRpPPreview(null);}}
                          style={{...bBtn("ghost"),padding:"6px 10px",fontSize:12,background:rpPOz===oz?C.orange+"22":"transparent",color:rpPOz===oz?C.orange:C.muted,border:"1px solid "+(rpPOz===oz?C.orange:C.border)}}>
                          {oz}oz
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end"}}>
                    <button style={{...bBtn("orange"),width:"100%"}} onClick={()=>{const lbs=parseFloat(rpPLbs);if(!lbs||!rpPOz)return;setRpPPreview({portions:Math.floor((lbs*16)/rpPOz),lbs,ozEach:rpPOz});}}>Calculate</button>
                  </div>
                </div>
                {rpPPreview&&(
                  <div style={{background:"#1a2018",border:"1px solid "+C.green+"44",borderRadius:10,padding:14,marginBottom:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center"}}>
                      {[{l:"Family Pack",v:rpPPreview.lbs+" lbs",c:C.muted},{l:"Dinner Portions",v:rpPPreview.portions,c:C.green},{l:"Each",v:rpPPreview.ozEach+"oz",c:C.accent}].map(s=>(
                        <div key={s.l}><div style={{fontSize:22,fontWeight:700,fontFamily:FD,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:C.muted,fontFamily:FM,marginTop:2}}>{s.l}</div></div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setRpOpen(false)}>Cancel</button>
                  <button style={{...bBtn("orange"),flex:2,opacity:(rpPName&&rpPLbs)?1:0.4}} onClick={commitProtein}>🥩 Add {rpPPreview?rpPPreview.portions+" Portions":"to Inventory"}</button>
                </div>
              </div>
            )}
            {rpMode==="veg"&&(
              <div>
                <div style={{background:"#141c14",border:"1px solid "+C.orange+"33",borderRadius:10,padding:12,marginBottom:14,fontSize:12,color:C.muted,lineHeight:1.6}}>
                  <strong style={{color:C.orange}}>Mixed Sauté Blend</strong> — diced onion + celery + bell pepper, bagged in 2-cup portions.
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                  {[{label:"🧅 Onions",key:"onions",cupsEach:1.5},{label:"🥬 Celery stalks",key:"celery",cupsEach:0.5},{label:"🫑 Bell peppers",key:"peppers",cupsEach:1.0}].map(v=>{
                    const s=rpVSessions.find(s=>s.id===v.key)||{count:""};
                    return(
                      <div key={v.key}>
                        <Label>{v.label}</Label>
                        <input style={bInp} type="number" min="0" placeholder="0" value={s.count||""}
                          onChange={e=>setRpVSessions(p=>{
                            const existing=p.find(s=>s.id===v.key);
                            const cnt=parseFloat(e.target.value)||0;
                            const bags=Math.floor((cnt*v.cupsEach)/2);
                            if(existing) return p.map(s=>s.id===v.key?{...s,count:e.target.value,bags}:s);
                            return [...p,{id:v.key,count:e.target.value,bags,cupsEach:v.cupsEach}];
                          })}/>
                        {s.count&&parseFloat(s.count)>0&&<div style={{fontSize:10,color:C.muted,marginTop:3,fontFamily:FM}}>{(parseFloat(s.count)*v.cupsEach).toFixed(1)} cups</div>}
                      </div>
                    );
                  })}
                </div>
                {(()=>{
                  const o=parseFloat(rpVSessions.find(s=>s.id==="onions")?.count||0)||0;
                  const c=parseFloat(rpVSessions.find(s=>s.id==="celery")?.count||0)||0;
                  const p=parseFloat(rpVSessions.find(s=>s.id==="peppers")?.count||0)||0;
                  const total=(o*1.5)+(c*0.5)+(p*1.0);
                  const bags=Math.floor(total/2);
                  if(total===0) return null;
                  return(
                    <div style={{background:"#1a180f",border:"1px solid "+C.orange+"44",borderRadius:10,padding:14,marginBottom:14,textAlign:"center"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                        {[{l:"Total Cups",v:total.toFixed(1),c:C.orange},{l:"2-Cup Bags",v:bags,c:C.green},{l:"Cups Left",v:(total%2).toFixed(1),c:C.muted}].map(s=>(
                          <div key={s.l}><div style={{fontSize:22,fontWeight:700,fontFamily:FD,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:C.muted,fontFamily:FM,marginTop:2}}>{s.l}</div></div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div style={{display:"flex",gap:8}}>
                  <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setRpOpen(false)}>Cancel</button>
                  <button style={{...bBtn("teal"),flex:2}} onClick={()=>{
                    const o=parseFloat(rpVSessions.find(s=>s.id==="onions")?.count||0)||0;
                    const c=parseFloat(rpVSessions.find(s=>s.id==="celery")?.count||0)||0;
                    const p=parseFloat(rpVSessions.find(s=>s.id==="peppers")?.count||0)||0;
                    const bags=Math.floor(((o*1.5)+(c*0.5)+(p*1.0))/2);
                    if(bags===0){alert("Not enough veg for a 2-cup bag.");return;}
                    setInventory(prev=>{
                      const idx=prev.findIndex(i=>i.vegType==="sauteBlend");
                      if(idx>=0) return prev.map((i,ii)=>ii===idx?{...i,qty:i.qty+bags}:i);
                      return [...prev,{id:Date.now(),name:"Mixed Sauté Blend",qty:bags,unit:"2-cup bags",category:"Produce",location:"Freezer",isDicedVeg:true,vegType:"sauteBlend",cupsPerBag:2,blendNote:"Diced onion + celery + bell pepper"}];
                    });
                    setRpOpen(false);
                  }}>🫕 Add {Math.floor(((parseFloat(rpVSessions.find(s=>s.id==="onions")?.count||0)||0)*1.5+((parseFloat(rpVSessions.find(s=>s.id==="celery")?.count||0)||0)*0.5)+((parseFloat(rpVSessions.find(s=>s.id==="peppers")?.count||0)||0)*1.0))/2)} Bags</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* == SCAN MODAL == */}
      {scanOpen&&(
        <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>{if(scanStage!=="review")setScanOpen(false);}}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:18,padding:"12px 16px",maxWidth:540,width:"100%",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontFamily:FM,color:C.muted}}>{scanMode==="receipt"?"🧾 Receipt Scanner":scanMode==="weeklyad"?"🏷️ Weekly Ad Scanner":"📷 Shelf Scanner"} · {scanStage==="review"?"Review items":"tap photo or browse"}</div>
              <button onClick={()=>setScanOpen(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            {scanStage==="upload"&&(
              <div>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  <button onClick={()=>{setScanMode("shelf");setScanPreview(null);setScanB64(null);}}
                    style={{flex:1,padding:"12px",borderRadius:9,border:"1px solid "+(scanMode==="shelf"?C.accent:C.border),background:scanMode==="shelf"?C.accent+"22":"transparent",color:scanMode==="shelf"?C.accent:C.muted,cursor:"pointer",fontFamily:FM,fontSize:13,fontWeight:700}}>
                    📷 Shelf Photo
                  </button>
                  <button onClick={()=>{setScanMode("receipt");setScanPreview(null);setScanB64(null);}}
                    style={{flex:1,padding:"12px",borderRadius:9,border:"1px solid "+(scanMode==="receipt"?C.accent:C.border),background:scanMode==="receipt"?C.accent+"22":"transparent",color:scanMode==="receipt"?C.accent:C.muted,cursor:"pointer",fontFamily:FM,fontSize:13,fontWeight:700}}>
                    🧾 Receipt
                  </button>
                  <button onClick={()=>{setScanMode("weeklyad");setScanPreview(null);setScanB64(null);}}
                    style={{flex:1,padding:"12px",borderRadius:9,border:"1px solid "+(scanMode==="weeklyad"?"#f59e0b":C.border),background:scanMode==="weeklyad"?"#f59e0b22":"transparent",color:scanMode==="weeklyad"?"#f59e0b":C.muted,cursor:"pointer",fontFamily:FM,fontSize:13,fontWeight:700}}>
                    🏷️ Weekly Ad
                  </button>
                </div>
                {scanMode==="receipt"&&(
                  <div style={{background:"#1a2018",borderRadius:10,padding:12,marginBottom:12,fontSize:12,color:C.muted,lineHeight:1.6}}>
                    📸 Lay receipt flat, good lighting, capture full receipt in frame.
                  </div>
                )}
                {scanMode==="weeklyad"&&(
                  <div style={{background:"#1a1a00",borderRadius:10,padding:12,marginBottom:12,fontSize:12,color:"#fbbf24",lineHeight:1.6}}>
                    🏷️ Screenshot the weekly ad from your Meijer app, or photograph a printed flyer page by page. Sale items will be extracted and used to build a budget meal plan.
                  </div>
                )}
                <div onClick={()=>fileRef.current.click()}
                  style={{border:"2px dashed "+(scanPreview?C.accent:C.border),borderRadius:12,cursor:"pointer",overflow:"hidden",minHeight:160,display:"flex",alignItems:"center",justifyContent:"center",background:scanPreview?"transparent":C.card,marginBottom:12}}>
                  {scanPreview?(
                    <div style={{position:"relative",width:"100%"}}>
                      <img src={scanPreview} alt="" style={{width:"100%",display:"block",borderRadius:10,maxHeight:240,objectFit:"cover"}}/>
                      <button onClick={e=>{e.stopPropagation();setScanPreview(null);setScanB64(null);}} style={{position:"absolute",top:8,right:8,background:"#000a",border:"none",color:"#fff",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:13}}>✕</button>
                    </div>
                  ):(
                    <div style={{textAlign:"center",padding:30}}>
                      <div style={{fontSize:32,marginBottom:8}}>{scanMode==="receipt"?"🧾":scanMode==="weeklyad"?"🏷️":"📷"}</div>
                      <div style={{fontFamily:FD,fontSize:16,color:C.text}}>{scanMode==="receipt"?"Tap to photograph receipt":scanMode==="weeklyad"?"Tap to screenshot weekly ad":"Tap to photograph shelf"}</div>
                      <div style={{fontSize:12,color:C.muted,marginBottom:12}}>opens camera directly</div>
                      <button onClick={e=>{e.stopPropagation();galleryRef.current.click();}} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:8,color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:11,padding:"6px 14px"}}>📂 Choose from Gallery</button>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>onFile(e.target.files[0])}/>
                <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>onFile(e.target.files[0])}/>
                <div style={{display:"flex",gap:8}}>
                  <button style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid "+C.border,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:12,fontWeight:600}} onClick={()=>setScanOpen(false)}>Cancel</button>
                  <button style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:scanB64?C.accent:"#333",color:scanB64?"#0c0e14":C.muted,cursor:scanB64?"pointer":"not-allowed",fontFamily:FM,fontSize:12,fontWeight:700,opacity:scanB64?1:0.5}}
                    onClick={scanMode==="receipt"?analyzeReceipt:scanMode==="weeklyad"?analyzeWeeklyAd:analyzePhoto} disabled={!scanB64}>
                    {scanMode==="receipt"?"🧾 Read Receipt":scanMode==="weeklyad"?"🏷️ Extract Sale Items":"🔍 Analyze Photo"}
                  </button>
                </div>
              </div>
            )}
            {scanStage==="analyzing"&&(
              <div style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:48,marginBottom:16}}>⏳</div>
                <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:8}}>{scanMode==="receipt"?"Reading Receipt...":"Analyzing Photo..."}</div>
                <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:24}}>This may take 10-20 seconds</div>
                {scanPreview&&<img src={scanPreview} alt="" style={{width:"100%",borderRadius:8,maxHeight:180,objectFit:"cover",opacity:0.5}}/>}
              </div>
            )}
            {scanStage==="review"&&scanResults&&(
              <div>
                {scanPreview&&<img src={scanPreview} alt="" style={{width:"100%",borderRadius:8,maxHeight:100,objectFit:"cover",marginBottom:10,opacity:0.65}}/>}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
                  <div style={{fontFamily:FM,fontSize:11,color:C.muted}}>{scanResults.filter(i=>i.selected).length}/{scanResults.length} selected</div>
                  <button style={{...bBtn("ghost"),fontSize:11,padding:"4px 10px"}} onClick={()=>setScanResults(p=>{const a=p.every(i=>i.selected);return p.map(i=>({...i,selected:!a}));})}>{scanResults.every(i=>i.selected)?"Deselect All":"Select All"}</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:320,overflowY:"auto"}}>
                  {scanResults.map((item,i)=>(
                    <div key={i} style={{background:item.selected?"#1f2a40":C.card,border:"1px solid "+(item.selected?C.borderLight:C.border),borderRadius:10,padding:"10px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:item.selected?8:0,cursor:"pointer"}} onClick={e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT")return;setScanResults(p=>p.map((si,sii)=>sii===i?{...si,selected:!si.selected}:si))}}>
                        <div style={{width:18,height:18,borderRadius:4,border:"2px solid "+(item.selected?C.green:C.border),background:item.selected?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>{item.selected&&"✓"}</div>
                        <div style={{flex:1}}>
                          <input style={{fontSize:13,fontWeight:600,border:"1px solid #555",borderRadius:4,padding:"2px 6px",width:"100%",background:"#1e1e1e",color:"#ffffff"}} value={item.name} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],name:e.target.value};setScanResults(updated)}} />
                          <div style={{fontSize:11,color:C.muted,fontFamily:FM,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}><input type="number" style={{width:50,fontSize:11,border:"1px solid #555",borderRadius:3,padding:"1px 4px",background:"#1e1e1e",color:"#ffffff"}} value={item.qty} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],qty:e.target.value};setScanResults(updated)}} /><input style={{width:60,fontSize:11,border:"1px solid #555",borderRadius:3,padding:"1px 4px",background:"#1e1e1e",color:"#ffffff"}} value={item.unit} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],unit:e.target.value};setScanResults(updated)}} /> · {item.category} · {item.location||"Pantry"}{item.price?<span style={{color:"#cbd5e1",fontWeight:600,marginLeft:4}}>{item.price}</span>:""} · <span style={{padding:"1px 6px",borderRadius:10,fontSize:10,fontWeight:700,background:item.confidence==="high"?"#14532d":item.confidence==="low"?"#7f1d1d":"#78350f",color:item.confidence==="high"?"#4ade80":item.confidence==="low"?"#f87171":"#fcd34d"}}>{item.confidence==="high"?"✓ High":item.confidence==="low"?"⚠ Low":"● Med"}</span>{item.expiryDays&&<span style={{padding:"1px 6px",borderRadius:10,fontSize:10,fontWeight:600,background:item.expiryDays<=3?"#7f1d1d":item.expiryDays<=7?"#78350f":"#1a2e1a",color:item.expiryDays<=3?"#fca5a5":item.expiryDays<=7?"#fcd34d":"#86efac",marginLeft:2}}>⏱ {item.expiryDays<=2?"Use/freeze within "+item.expiryDays+" days":item.expiryDays<=7?"Use within "+item.expiryDays+" days":item.expiryDays+" day shelf life"}</span>}</div>
                        </div>
                        <span style={bTag(item.action==="update"?C.blue:C.green)}>{item.action==="update"?"UPDATE":"NEW"}</span>
                      </div>
                      {item.selected&&(
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4}} onClick={e=>e.stopPropagation()}>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>QTY</div><input type="number" value={item.qty} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,qty:parseFloat(e.target.value)||si.qty}:si))} style={{...bInp,padding:"5px 8px",fontSize:12}}/></div>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>UNIT</div><input value={item.unit} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,unit:e.target.value}:si))} style={{...bInp,padding:"5px 8px",fontSize:12}}/></div>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>LOCATION</div><select value={item.location||"Pantry"} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,location:e.target.value}:si))} style={{...bInp,padding:"5px 8px",fontSize:12}}><option>Pantry</option><option>Fridge</option><option>Freezer</option></select></div>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>CATEGORY</div><select value={item.category||"Pantry"} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,category:e.target.value}:si))} style={{...bInp,padding:"5px 8px",fontSize:12}}><option>Protein</option><option>Produce</option><option>Dairy</option><option>Pantry</option><option>Frozen</option><option>Grains</option><option>Condiments</option></select></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {scanMode!=="weeklyad"&&<div style={{display:"flex",gap:8,marginTop:12}}>
                  <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px",marginBottom:4,borderTop:"1px solid "+C.border}}>
                    <span style={{fontFamily:FM,fontSize:11,color:C.muted}}>{scanResults.filter(i=>i.selected).length} of {scanResults.length} items selected</span>
                    <span style={{fontFamily:FM,fontSize:11,color:C.accent,fontWeight:600}}>Est. total: ${scanResults.filter(i=>i.selected&&i.price).reduce((sum,i)=>{const p=parseFloat((i.price||"").replace(/[^0-9.]/g,""));return sum+(isNaN(p)?0:p);},0).toFixed(2)}</span>
                  </div>
                  <button style={{...bBtn("ghost"),flex:1}} onClick={()=>{setScanStage("upload");setScanResults(null);}}>← Rescan</button>
                  <button style={{...bBtn("green"),flex:2}} onClick={commitScan}>✅ Save {scanResults.filter(i=>i.selected).length} Items</button>
                </div>}
              </div>
            )}
            {scanStage==="done"&&<div style={{textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div style={{fontFamily:FD,fontSize:22,color:C.green}}>Inventory Updated!</div></div>}
          </div>
        </div>
      )}

      {/* == RECIPE MODAL == */}
      {activeRecipe&&(
        <div style={{position:"fixed",inset:0,background:"#000b",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setActiveRecipe(null)}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:16,padding:22,maxWidth:500,width:"100%",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontFamily:FD,fontSize:24,lineHeight:1.3,flex:1}}>{activeRecipe.name}</div>
              <button onClick={()=>setActiveRecipe(null)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            <div style={{color:C.muted,fontSize:13,marginBottom:14,lineHeight:1.6}}>{activeRecipe.description}</div>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              <span style={bTag(C.muted)}>⏱ {activeRecipe.time}</span>
              <span style={bTag(activeRecipe.difficulty==="Easy"?C.green:activeRecipe.difficulty==="Hard"?C.red:C.accent)}>{activeRecipe.difficulty}</span>
              <span style={bTag(C.blue)}>👨‍👩‍👧 {activeProfiles.length} people</span>
            </div>
            {(activeRecipe.missingIngredients||[]).length>0&&(
              <div style={{background:C.red+"15",border:"1px solid "+C.red+"33",borderRadius:10,padding:12,marginBottom:14}}>
                <div style={{fontSize:10,fontFamily:FM,color:C.red,marginBottom:6,letterSpacing:0.8}}>MISSING</div>
                {activeRecipe.missingIngredients.map((m,i)=><div key={i} style={{fontSize:13,color:C.red,marginBottom:3}}>· {m}</div>)}
              </div>
            )}
            <div style={{fontFamily:FM,fontSize:10,color:C.muted,letterSpacing:1,marginBottom:10}}>INSTRUCTIONS</div>
            {(activeRecipe.instructions||[]).map((step,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:12,alignItems:"flex-start"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:C.accent,color:"#0c0e14",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:13,lineHeight:1.7,color:C.text}}>{step}</div>
              </div>
            ))}
            <button style={{...bBtn("primary"),width:"100%",marginTop:10,padding:12}} onClick={()=>cookRecipe(activeRecipe)}>🍳 I Cooked This — Update Inventory</button>
          </div>
        </div>
      )}

      {/* == DESSERT MODAL == */}
      {activeDessert&&(
        <div style={{position:"fixed",inset:0,background:"#000b",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setActiveDessert(null)}>
          <div style={{background:C.surface,border:"1px solid "+C.accent+"66",borderRadius:16,padding:22,maxWidth:500,width:"100%",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontFamily:FD,fontSize:24,lineHeight:1.3,flex:1,color:C.accent}}>{activeDessert.name}</div>
              <button onClick={()=>setActiveDessert(null)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            <div style={{color:C.muted,fontSize:13,marginBottom:14,lineHeight:1.6}}>{activeDessert.description}</div>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              <span style={bTag(C.muted)}>⏱ {activeDessert.time}</span>
              <span style={bTag("#f472b6")}>{activeDessert.category}</span>
              <span style={bTag(activeDessert.difficulty==="Easy"?C.green:activeDessert.difficulty==="Hard"?C.red:C.accent)}>{activeDessert.difficulty}</span>
              {activeDessert.servings&&<span style={bTag(C.blue)}>🍽 {activeDessert.servings} servings</span>}
            </div>
            <div style={{marginBottom:12}}>
              <a href={getRecipeUrl(activeDessert.name)} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#f59e0b",fontFamily:FM,textDecoration:"none",fontWeight:600,letterSpacing:0.5}}>TAP FOR FULL RECIPE →</a>
              <a href={getRecipeUrl(activeDessert.name)} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#60a5fa",fontFamily:FM,textDecoration:"none",fontWeight:600,marginLeft:10}}>🌐 web search</a>
            </div>
            {(activeDessert.missingIngredients||[]).length>0&&(
              <div style={{background:C.red+"15",border:"1px solid "+C.red+"33",borderRadius:10,padding:12,marginBottom:14}}>
                <div style={{fontSize:10,fontFamily:FM,color:C.red,marginBottom:6}}>NEED TO GET</div>
                {activeDessert.missingIngredients.map((m,i)=><div key={i} style={{fontSize:13,color:C.red,marginBottom:3}}>· {m}</div>)}
              </div>
            )}
            <div style={{fontFamily:FM,fontSize:10,color:C.muted,letterSpacing:1,marginBottom:10}}>INSTRUCTIONS</div>
            {(activeDessert.steps||activeDessert.instructions||[]).map((step,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:12,alignItems:"flex-start"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"#f472b6",color:"#0c0e14",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:13,lineHeight:1.7,color:C.text}}>{step}</div>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              {(activeDessert.missingIngredients||[]).length>0&&<button style={{...bBtn("ghost"),flex:1,padding:12,border:"1px solid #f472b6",color:"#f472b6"}}
                onClick={()=>{
                  setShopping(prev=>{
                    const missing=(activeDessert.missingIngredients||[]).map(name=>({name,qty:1,unit:"as needed",category:"Pantry",checked:false,suggestBulk:false}));
                    const toAdd=missing.filter(m=>!prev.some(p=>p.name.toLowerCase()===m.name.toLowerCase()));
                    return [...prev,...toAdd];
                  });
                  setActiveDessert(null);
                  alert("🛒 Missing ingredients added to shopping list!");
                }}>🛒 Add Missing to List</button>}
              <button style={{...bBtn("primary"),flex:2,padding:12,background:"#f472b6",color:"#0c0e14"}}
                onClick={()=>{
                  setInventory(p=>p.map(i=>{
                    if(!(activeDessert.usesFromInventory||[]).some(u=>u.toLowerCase()===i.name.toLowerCase()))return i;
                    return {...i,qty:Math.max(0,+(i.qty-1).toFixed(1))};
                  }));
                  setActiveDessert(null);
                  alert("✅ \""+activeDessert.name+"\" made! Inventory updated.");
                }}>🍰 I Made This — Update Inventory</button>
            </div>
          </div>
        </div>
      )}

      {/* == PRINT MODAL == */}
      {printModal&&(
        <div style={{position:"fixed",inset:0,background:"#000d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"white",color:"#111",borderRadius:14,padding:24,maxWidth:660,width:"100%",maxHeight:"90vh",overflowY:"auto",fontFamily:"Arial, sans-serif"}}>
            <div id="sk-no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,borderBottom:"2px solid #eee",paddingBottom:12}}>
              <div>
                <div style={{fontSize:17,fontWeight:"bold"}}>{printModal==="mealplan"?"🍽 Meal Plan":"🛒 Shopping List"}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>Press <strong>Ctrl+P</strong> (Win) or <strong>Cmd+P</strong> (Mac) to print</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>window.print()} style={{background:"#f0a500",border:"none",borderRadius:8,padding:"8px 18px",fontWeight:"bold",cursor:"pointer",fontSize:13}}>🖨 Print Now</button>
                <button onClick={()=>setPrintModal(null)} style={{background:"#eee",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✕</button>
              </div>
            </div>
            <div id="sk-print-content">
              {printModal==="mealplan"&&(
                <div>
                  <div style={{fontSize:22,fontWeight:"bold",marginBottom:4}}>Weekly Meal Plan</div>
                  <div style={{fontSize:12,color:"#666",marginBottom:16}}>Smart Kitchen · {new Date().toLocaleDateString()}</div>
                  <div style={{background:"#f5f5f5",borderRadius:6,padding:"8px 12px",marginBottom:14,fontSize:12}}>
                    <strong>This week: </strong>{mealPlan.filter(d=>d.proteinUsed).map((d,i)=><span key={i}>{d.day?.slice(0,3)}: {d.proteinUsed}{i<mealPlan.filter(x=>x.proteinUsed).length-1?" · ":""}</span>)}
                  </div>
                  {mealPlan.map((day,i)=>(
                    <div key={i} style={{border:"1px solid #ddd",borderRadius:6,padding:"10px 14px",marginBottom:8}}>
                      <div style={{fontSize:10,color:"#999",textTransform:"uppercase",letterSpacing:1}}>Day {i+1}</div>
                      <div style={{fontSize:17,fontWeight:"bold",margin:"3px 0 5px"}}>{day.day} — {day.meal}</div>
                      <div style={{fontSize:12,color:"#555",marginBottom:4}}>{[day.proteinUsed&&"Protein: "+day.proteinUsed,(day.sauteBagsUsed||0)>0&&"Saute blend: "+day.sauteBagsUsed+" bag",day.sideUsed&&"Side: "+day.sideUsed].filter(Boolean).join(" · ")}</div>
                      {(day.shoppingNeeded||[]).length===0?<div style={{fontSize:12,color:"#080"}}>✅ All on hand</div>:<div style={{fontSize:12,color:"#c00"}}>Need: {(day.shoppingNeeded||[]).map(s=>s.qty+" "+s.unit+" "+s.name).join(", ")}</div>}
                    </div>
                  ))}
                </div>
              )}
              {printModal==="shopping"&&(
                <div>
                  <div style={{fontSize:22,fontWeight:"bold",marginBottom:4}}>Shopping List</div>
                  <div style={{fontSize:12,color:"#666",marginBottom:18}}>Smart Kitchen · {new Date().toLocaleDateString()}</div>
                  {CATEGORIES.filter(cat=>shopping.some(i=>i.category===cat)).map(cat=>(
                    <div key={cat}>
                      <div style={{fontSize:11,fontWeight:"bold",textTransform:"uppercase",color:"#888",letterSpacing:1,margin:"14px 0 5px",borderBottom:"1px solid #eee",paddingBottom:3}}>{cat}</div>
                      {shopping.filter(i=>i.category===cat).map((item,idx)=>(
                        <div key={idx} style={{display:"flex",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f5f5f5",fontSize:14}}>
                          <div style={{width:16,height:16,border:"1.5px solid #999",borderRadius:3,marginRight:12,flexShrink:0}}/>
                          <span style={{flex:1}}>{item.name}{item.suggestBulk?" 📦":""}</span>
                          <span style={{color:"#666",fontSize:12}}>{item.qty} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}<button onClick={()=>regenerateDay(i)} style={{marginTop:4,background:"transparent",border:"1px solid "+C.border,borderRadius:6,color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:10,padding:"3px 7px",width:"100%"}}>🔄 New Meal</button>

