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
  {id:63,name:"Eggs",            qty:24,unit:"count",    category:"Protein",location:"Fridge"},
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
  {id:818,name:"Eggs",qty:12,unit:"count",category:"Protein",location:"Fridge"},
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
  const [profileModalOpen,setProfileModalOpen]=useState(false);
  const [recipeSite,setRecipeSite]=useState(()=>loadLocal("sk_recipeSite","google"));
  const [showWizard,setShowWizard]=useState(()=>{try{return localStorage.getItem("sk_setupDone")!=="1"&&loadLocal("sk_inventory",[]).length===0;}catch{return false;}});
  const [wizardStep,setWizardStep]=useState(0);
  const [wizardProteins,setWizardProteins]=useState([]);
  const [wizardProteinInput,setWizardProteinInput]=useState({name:"",qty:"",oz:"6"});
  const [pantryChecklist,setPantryChecklist]=useState(()=>COMMON_PANTRY.map(i=>({...i,checked:false})));
  const [showInstallBanner,setShowInstallBanner]=useState(()=>{try{return localStorage.getItem("sk_installDismissed")!=="1";}catch{return true;}});
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
  const [rpOpen,setRpOpen]=useState(false);
  const [rpMode,setRpMode]=useState("protein");
  const [rpPName,setRpPName]=useState("");
  const [rpPLbs,setRpPLbs]=useState("");
  const [rpPOz,setRpPOz]=useState(6);
  const [rpPPreview,setRpPPreview]=useState(null);
  const [rpVSessions,setRpVSessions]=useState([{id:1,preset:{name:"Mixed Sauté Blend",cupsPerUnit:3,bagCups:2,color:C.orange},count:"",bags:null}]);
  const fileRef=useRef();
  const galleryRef=useRef();
  useEffect(()=>{setInventory(prev=>{const skipUnits=["lb","oz","g","kg","can","jar","bottle","stick","bunch","gallon","slice","slices"];const isBulkCandidate=i=>i.category==="Protein"&&!i.isBulkProtein&&(i.location==="Freezer"||!i.location)&&!skipUnits.includes((i.unit||"").toLowerCase())&&(parseFloat(i.qty)||0)<=50;const needsFix=prev.some(isBulkCandidate);if(!needsFix)return prev;return prev.map(i=>isBulkCandidate(i)?{...i,isBulkProtein:true,location:"Freezer",portionOz:i.portionOz||6}:i);});},[]);
  useEffect(()=>{try{localStorage.setItem("sk_inventory",JSON.stringify(inventory));}catch{}},[inventory]);
  useEffect(()=>{try{localStorage.setItem("sk_mealPlan",JSON.stringify(mealPlan));}catch{}},[mealPlan]);
  useEffect(()=>{try{localStorage.setItem("sk_familySize",JSON.stringify(familySize));}catch{}},[familySize]);
  useEffect(()=>{try{localStorage.setItem("sk_familyProfiles",JSON.stringify(familyProfiles));}catch{}},[familyProfiles]);
  useEffect(()=>{try{localStorage.setItem("sk_sportsNights",JSON.stringify(sportsNights));}catch{}},[sportsNights]);

  // -- Computed values --------------------------------------------------------
  const blendItem=inventory.find(i=>i.vegType==="sauteBlend");
  const proteinItems=inventory.filter(i=>i.isBulkProtein);
  const totalPortions=proteinItems.reduce((a,i)=>a+i.qty,0);
  const condimentItems=inventory.filter(i=>i.isCondiment);
  const activeProfiles=familyProfiles.filter(p=>p.active);
  const restrictedProfiles=activeProfiles.filter(p=>p.restriction!=="none"&&p.restriction!=="standard"&&p.restriction!=="athlete");
  const activeFlags=activeProfiles.flatMap(p=>RESTRICTION_PRESETS[p.restriction]?.flags||[]);
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
        system:"You are a grocery receipt parser. Analyze this receipt image and extract every food/grocery item purchased. Return ONLY a valid JSON array. Each object: {name(string, clean product name), qty(number, default 1), unit(string, best guess like bottle can bag box lb oz count), category(Protein|Produce|Dairy|Pantry|Grains|Spices|Frozen|Condiments|Other), location(MUST use these exact rules: Protein/Meat/Seafood=Freezer, Dairy/Eggs/Fresh Produce/Condiments/Dressings/Sauces=Fridge, Canned goods/Dry goods/Spices/Grains/Baking/Snacks/Beverages/Frozen=Pantry or Freezer based on item type), isProtein(boolean), price(string)}. Skip non-food items. Clean up product names.",
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
        system:"Kitchen inventory AI. Analyze the photo. Return ONLY valid JSON array. Each item: {name,qty,unit,category,location,confidence}. category is one of: Protein, Produce, Dairy, Pantry, Grains, Spices, Frozen, Condiments, Other. location rules (MUST follow): Protein/Meat/Seafood/Poultry/Pork/Beef/Fish = Freezer. Dairy/Eggs/Fresh Produce/Deli meats/Condiments/Dressings = Fridge. Canned goods/Dry goods/Spices/Grains/Baking/Snacks/Beverages = Pantry. Frozen packaged foods = Freezer. confidence is high, medium, or low.",
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
        prompt:"Proteins: "+proteins+". Saute blend: "+(blendItem?.qty||0)+" bags. "+fs+"Busy night on "+day.day+". Already this week: "+mealPlan.filter((_,ii)=>ii!==dayIdx).map(d=>d.meal).filter(Boolean).join(", ")+". Give ONE DIFFERENT quick dinner under 20 min — tacos, stir fry, sandwiches, or wraps. No duplicates.",
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
        prompt:"Proteins: "+proteins+". Saute blend: "+(blendItem?.qty||0)+" bags. "+fs+"Regular weeknight dinner for "+mealPlan[dayIdx]?.day+". 30-45 min OK.",
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

      {showWizard&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.surface,borderRadius:16,padding:28,maxWidth:440,width:"100%",border:"1px solid "+C.border}}>
            {wizardStep===0&&(<div>
              <div style={{fontFamily:FD,fontSize:24,color:C.accent,marginBottom:8}}>👋 Welcome to Smart Kitchen!</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>Let's set up your kitchen in 2 minutes. We'll start by adding your freezer proteins — the foundation of your meal plan.</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:12}}>How would you like to get started?</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button style={{...bBtn("primary"),padding:"14px",textAlign:"left"}} onClick={()=>{try{localStorage.setItem('sk_setupDone','1');}catch{} setShowWizard(false);setTimeout(()=>setScanOpen(true),300);}}>
              <div style={{fontFamily:FD,fontSize:14}}>📸 Scan items with camera</div>
              <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>Take photos of receipts, packages, or pantry items</div>
            </button>
            <button style={{...bBtn("ghost"),padding:"14px",textAlign:"left"}} onClick={()=>setWizardStep(1)}>
              <div style={{fontFamily:FD,fontSize:14}}>✏️ Enter items manually</div>
              <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>Type in your proteins, produce, and pantry staples</div>
            </button>
          </div>
            </div>)}
            {wizardStep===1&&(<div>
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
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(2)}>Skip</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>setWizardStep(2)}>Next →</button>
              </div>
            </div>)}
            {wizardStep===2&&(<div>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:6}}>🔍 Recipe Search</div>
              <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:16}}>When you tap a meal name, which site opens for detailed recipes?</div>
              {[["google","🔍 Google Recipes"],["allrecipes","🍳 AllRecipes"],["pinterest","📌 Pinterest"],["foodnetwork","📺 Food Network"]].map(([key,label])=>(
                <div key={key} onClick={()=>setRecipeSite(key)} style={{padding:"12px 16px",borderRadius:10,marginBottom:8,cursor:"pointer",border:"2px solid "+(recipeSite===key?C.accent:C.border),background:recipeSite===key?C.accent+"11":C.card,fontFamily:FM,fontSize:13,color:recipeSite===key?C.accent:C.text}}>{label}</div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(1)}>← Back</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>setWizardStep(3)}>Next →</button>
              </div>
            </div>)}
            {wizardStep===3&&(<div>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:6}}>📦 Inventory Setup</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>How do you want to start your pantry inventory?</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button style={{...bBtn('primary'),padding:'16px',textAlign:'left'}} onClick={()=>{setPantryChecklist(COMMON_PANTRY.map(i=>({...i,checked:true})));setWizardStep(4)}}>
                  <div style={{fontFamily:FD,fontSize:14}}>✅ Start with common pantry items</div>
                  <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>We'll pre-check ~30 staples — just uncheck what you don't have</div>
                </button>
                <button style={{...bBtn('ghost'),padding:'16px',textAlign:'left'}} onClick={()=>{setPantryChecklist(COMMON_PANTRY.map(i=>({...i,checked:false})));setWizardStep(4)}}>
                  <div style={{fontFamily:FD,fontSize:14}}>🔲 Start from scratch</div>
                  <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginTop:4}}>Manually check off what you have</div>
                </button>
              </div>
              <div style={{display:'flex',gap:8,marginTop:16}}>
                <button style={{...bBtn('ghost'),flex:1}} onClick={()=>setWizardStep(2)}>← Back</button>
              </div>
            </div>)}
            {wizardStep===4&&(<div>
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
                <button style={{...bBtn('ghost'),flex:1}} onClick={()=>setWizardStep(3)}>← Back</button>
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
          <button style={bBtn("ghost")} onClick={()=>openRepack("veg")}>🫕 Prep Veg</button>
          <button style={bBtn("orange")} onClick={()=>openRepack("protein")}>🥩 Repackage</button>
          <button style={bBtn("ghost")} onClick={()=>{setScanOpen(true);setScanStage("upload");setScanResults(null);setScanPreview(null);setScanB64(null);setScanMode("shelf");}}>📷 Scan</button>
          <button style={bBtn("primary")} onClick={fetchRecipes}>✨ Recipes</button>
        </div>
      </div>

      {/* -- Tabs -- */}
      <div style={{display:"flex",background:C.surface,borderBottom:"1px solid "+C.border,paddingLeft:12,overflowX:"auto"}}>
        {[["inventory","📦","Inventory"],["recipes","🍽","Recipes"],["mealplan","📅","Meal Plan"],["shopping","🛒","Shopping"],["desserts","🍰","Desserts"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"transparent",border:"none",borderBottom:"2px solid "+(tab===k?C.accent:"transparent"),padding:"11px 16px",color:tab===k?C.accent:C.muted,cursor:"pointer",fontFamily:FM,fontSize:11,fontWeight:600,letterSpacing:0.8,whiteSpace:"nowrap",transition:"all 0.15s"}}>
            {ic} {lb.toUpperCase()}
          </button>
        ))}
      </div>

      {/* -- Content -- */}
      <div style={{padding:"20px",maxWidth:940,margin:"0 auto"}}>
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
                  {[["Protein","#ef4444"],["Produce","#22c55e"],["Dairy","#60a5fa"],["Frozen","#a78bfa"],["Pantry","#f59e0b"],["Grains","#d97706"],["Condiments","#94a3b8"],["Other","#6b7280"]].map(([cat,col])=>(
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
                        <div style={{fontWeight:600,fontSize:13,lineHeight:1.3}}>{item.name}</div>
                        {item.blendNote&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>{item.blendNote}</div>}
                        {item.isLow&&<div style={bTag(C.red)}>⚠️ Low</div>}
                      </div>
                      <button onClick={()=>setInventory(p=>p.filter(i=>i.id!==item.id))} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:14,padding:2}}>✕</button>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      <span style={bTag(CAT_COLORS[item.category]||C.muted)}>{item.category}</span>
                      <span style={bTag(LOC_COLORS[item.location]||C.muted)}>{LOC_ICONS[item.location]} {item.location}</span>
                      {isBP&&<span style={bTag(C.red)}>{item.portionOz}oz</span>}
                      {isDV&&<span style={bTag(C.orange)}>{item.cupsPerBag}c bag</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={()=>setInventory(p=>p.map(i=>i.id===item.id?{...i,qty:Math.max(0,i.qty-1)}:i))} style={{width:24,height:24,borderRadius:5,background:C.surface,border:"1px solid "+C.border,color:C.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{fontFamily:FM,fontSize:13,minWidth:56,textAlign:"center",color:item.qty===0?C.red:C.text}}>{item.qty} <span style={{fontSize:10,color:C.muted}}>{item.unit}</span></span>
                      <button onClick={()=>setInventory(p=>p.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i))} style={{width:24,height:24,borderRadius:5,background:C.surface,border:"1px solid "+C.border,color:C.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      {item.qty===0&&<span style={bTag(C.red)}>OUT</span>}
                    </div>
                    {(isBP||isDV)&&<button onClick={()=>openRepack(isBP?"protein":"veg")} style={{...bBtn("ghost"),padding:"4px 8px",fontSize:10,width:"100%"}}>{isBP?"🥩 Add Batch":"🫕 Prep More"}</button>}
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
                        <div style={{fontFamily:FD,fontSize:19,lineHeight:1.3,flex:1}}><a href={getRecipeUrl(r.name)} target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:"none"}}>🔍 {r.name}</a></div>
                        <span style={{...bTag(r.difficulty==="Easy"?C.green:r.difficulty==="Hard"?C.red:C.accent),marginLeft:8}}>{r.difficulty}</span>
                      </div>
                      <div style={{color:C.muted,fontSize:13,marginBottom:12,lineHeight:1.5}}>{r.description}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        <span style={bTag(C.muted)}>⏱ {r.time}</span>
                        <span style={bTag(C.blue)}>👨‍👩‍👧 {activeProfiles.length} people</span>
                        <span style={bTag(C.green)}>✅ {(r.usesFromInventory||[]).length} on hand</span>
                        {(r.missingIngredients||[]).length>0&&<span style={bTag(C.red)}>🛒 {r.missingIngredients.length} needed</span>}
                      </div>
                      <div style={{fontSize:11,color:C.accent,fontFamily:FM}}>TAP FOR FULL RECIPE →</div>
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
                    <div key={i} style={{background:day.quickMeal?"#1a1a2e":C.card,border:"1px solid "+(day.quickMeal?"#f59e0b":C.border),borderRadius:12,padding:15,display:"grid",gridTemplateColumns:"80px 1fr auto",gap:14,alignItems:"start"}}>
                      <div>
                        <div style={{fontFamily:FM,fontSize:9,color:C.muted,marginBottom:3}}>DAY {i+1}</div>
                        <div style={{fontWeight:700,color:C.accent,fontSize:18,fontFamily:FD}}>{day.day}</div>
                        <button onClick={()=>day.quickMeal?clearQuickMeal(i):quickMealForDay(i)} style={{marginTop:6,background:day.quickMeal?"#f59e0b22":"transparent",border:"1px solid "+(day.quickMeal?"#f59e0b":C.border),borderRadius:6,color:day.quickMeal?"#f59e0b":C.muted,cursor:"pointer",fontFamily:FM,fontSize:10,padding:"3px 7px",width:"100%"}}>{day.quickMeal?"⚡ Busy Night":"⚡ Busy Night?"}</button>
                      </div>
                      <div>
                        {day.quickMeal&&<span style={{fontSize:10,background:"#f59e0b22",color:"#f59e0b",padding:"2px 6px",borderRadius:4,fontFamily:FM,display:"inline-block",marginBottom:4}}>⚡ BUSY NIGHT — under 20 min</span>}
                        <div><div onClick={()=>openMealPlanRecipe(day)} style={{fontFamily:FD,fontSize:16,marginBottom:4,color:C.accent,cursor:"pointer"}}>🔍 {day.meal}</div><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:day.ingredients&&day.ingredients.length>0?6:0}}><span onClick={()=>openMealPlanRecipe(day)} style={{fontSize:11,color:"#f59e0b",fontFamily:FM,cursor:"pointer",letterSpacing:0.5,fontWeight:600}}>TAP FOR FULL RECIPE →</span><a href={getRecipeUrl(day.meal)} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#60a5fa",fontFamily:FM,textDecoration:"none",fontWeight:600}}>🌐 web</a></div>{day.ingredients&&day.ingredients.length>0&&<div style={{marginTop:6,padding:"8px 10px",background:"rgba(255,255,255,0.05)",borderRadius:6,fontSize:11,fontFamily:FM}}><div style={{fontWeight:600,marginBottom:4,color:C.muted}}>INGREDIENTS</div>{day.ingredients.map((ing,ii)=><div key={ii} style={{color:C.text,marginBottom:2}}>· {ing}</div>)}</div>}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {day.proteinUsed&&<span style={bTag(PROTEIN_TAG_COLOR(day.proteinUsed))}>🥩 {day.proteinUsed}</span>}
                          {(day.sauteBagsUsed||0)>0&&<span style={bTag(C.orange)}>🫕 {day.sauteBagsUsed} bag</span>}
                          {day.sideUsed&&<span style={bTag(C.green)}>🥦 {day.sideUsed}</span>}
                        </div>
                      </div>
                      <div style={{minWidth:120}}>
                        {(day.shoppingNeeded||[]).length===0
                          ?<span style={bTag(C.green)}>✅ Ready</span>
                          :<div><div style={{fontSize:9,color:C.muted,marginBottom:3,fontFamily:FM}}>NEED</div>{(day.shoppingNeeded||[]).map((s,j)=><div key={j} style={{fontSize:11,color:C.red,marginBottom:2}}>· {s.qty} {s.unit} {s.name}</div>)}</div>}
                        <button onClick={()=>madeMeal(day)} style={{marginTop:8,background:"#3ecf8e22",border:"1px solid #3ecf8e44",borderRadius:6,color:"#3ecf8e",cursor:"pointer",fontFamily:FM,fontSize:10,padding:"4px 8px",width:"100%"}}>✅ Made It!</button>
        <button onClick={()=>{setChangeMealModal(i);setChangeMealRequest("");}} style={{marginTop:6,background:"transparent",border:"1px solid "+C.border,borderRadius:4,color:C.muted,fontFamily:FM,fontSize:10,padding:"4px 8px",width:"100%",cursor:"pointer"}}>🔄 Change Meal</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {changeMealModal!==null&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setChangeMealModal(null)}><div style={{background:C.card,borderRadius:12,padding:24,width:360,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:C.text,marginBottom:16}}>🔄 Change {mealPlan[changeMealModal]?.day} Meal</div><div style={{marginBottom:16}}><button onClick={async()=>{setChangeMealLoading(true);const day=mealPlan[changeMealModal];const prompt=`Suggest a different dinner meal for ${day.day}. Current meal was: ${day.meal}. Use ingredients from this inventory where possible: ${inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")}. Return JSON: {meal,ingredients:[],needToBuy:[],proteinUsed:"",sauteBagsUsed:0,quickMeal:false}. For needToBuy, ONLY include items not found in the inventory list. Do not include items already in inventory.`;const res=await callClaude({system:"Meal planning AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{console.log("changeMeal res:",JSON.stringify(res));const resText=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||res?.[0]?.text||"";const raw=resText.replace(/```json|```/g,"").trim();console.log("raw:",raw);const s=raw.indexOf("{"),e=raw.lastIndexOf("}");const parsed=JSON.parse(raw.slice(s,e+1));setMealPlan(p=>p.map((d,i)=>i===changeMealModal?{...d,...parsed,needToBuy:parsed.needToBuy||[],ingredients:parsed.ingredients||[]}:d));setChangeMealModal(null);}catch(err){console.error("Parse error:",err);alert("Could not parse meal suggestion");}setChangeMealLoading(false);}} style={{width:"100%",padding:"10px",background:C.accent,border:"none",borderRadius:8,color:"#000",fontFamily:FM,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:10}}>✨ {changeMealLoading?"Thinking...":"Surprise Me"}</button><div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:8}}>— or request a specific meal —</div><input style={{width:"100%",padding:"8px",background:"#1e1e1e",border:"1px solid "+C.border,borderRadius:6,color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box",marginBottom:10}} placeholder='e.g. "Goulash"' value={changeMealRequest} onChange={e=>setChangeMealRequest(e.target.value)} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} /><button onClick={async()=>{if(!changeMealRequest.trim())return;setChangeMealLoading(true);const day=mealPlan[changeMealModal];const prompt=`Create a dinner meal plan for ${day.day} using "${changeMealRequest}". Use ingredients from inventory where possible: ${inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")}. Return JSON: {meal,ingredients:[],needToBuy:[],proteinUsed:"",sauteBagsUsed:0,quickMeal:false}. For needToBuy, ONLY include items not found in the inventory list. Do not include items already in inventory.`;const res=await callClaude({system:"Meal planning AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{const resText3=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||res?.[0]?.text||"";const raw=resText3;const s=raw.indexOf("{"),e=raw.lastIndexOf("}");const parsed=JSON.parse(raw.slice(s,e+1));setMealPlan(p=>p.map((d,i)=>i===changeMealModal?{...d,...parsed,needToBuy:parsed.needToBuy||[],ingredients:parsed.ingredients||[]}:d));setChangeMealModal(null);}catch(e){alert("Could not parse meal suggestion");}setChangeMealLoading(false);}} style={{width:"100%",padding:"10px",background:"transparent",border:"1px solid "+C.accent,borderRadius:8,color:C.accent,fontFamily:FM,fontSize:13,cursor:"pointer"}}>🍽️ {changeMealLoading?"Thinking...":"Make This Meal"}</button></div><button onClick={()=>setChangeMealModal(null)} style={{width:"100%",padding:"8px",background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer"}}>Cancel</button></div></div>}
{/* == SHOPPING == */}
        {!loading&&tab==="shopping"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:FD,fontSize:24}}>Shopping List</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {shopping.length>0&&<><div style={{fontFamily:FM,fontSize:11,color:C.muted}}>{shopping.filter(i=>i.checked).length}/{shopping.length}</div><button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11}} onClick={printShopping}>🖨 Print</button></>}
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
              {["Brownie Mixes","Muffin Mixes (×3)","Pie Crusts","Puff Pastry","Crescent Dough","Cream Cheese","Condensed Milk","Pie Fillings","Flour","Sugar","Vanilla","Butter","Eggs"].map(i=>(
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
                      <div style={{fontSize:11,color:C.accent,fontFamily:FM}}>TAP FOR RECIPE →</div>
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
              <div style={{fontSize:12,fontFamily:FM,color:C.muted}}>{scanMode==="receipt"?"🧾 Receipt Scanner":"📷 Shelf Scanner"} · {scanStage==="review"?"Review items":"tap photo or browse"}</div>
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
                </div>
                {scanMode==="receipt"&&(
                  <div style={{background:"#1a2018",borderRadius:10,padding:12,marginBottom:12,fontSize:12,color:C.muted,lineHeight:1.6}}>
                    📸 Lay receipt flat, good lighting, capture full receipt in frame.
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
                      <div style={{fontSize:32,marginBottom:8}}>{scanMode==="receipt"?"🧾":"📷"}</div>
                      <div style={{fontFamily:FD,fontSize:16,color:C.text}}>{scanMode==="receipt"?"Tap to photograph receipt":"Tap to photograph shelf"}</div>
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
                    onClick={scanMode==="receipt"?analyzeReceipt:analyzePhoto} disabled={!scanB64}>
                    {scanMode==="receipt"?"🧾 Read Receipt":"🔍 Analyze Photo"}
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
                          <div style={{fontSize:11,color:C.muted,fontFamily:FM,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}><input type="number" style={{width:50,fontSize:11,border:"1px solid #555",borderRadius:3,padding:"1px 4px",background:"#1e1e1e",color:"#ffffff"}} value={item.qty} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],qty:e.target.value};setScanResults(updated)}} /><input style={{width:60,fontSize:11,border:"1px solid #555",borderRadius:3,padding:"1px 4px",background:"#1e1e1e",color:"#ffffff"}} value={item.unit} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],unit:e.target.value};setScanResults(updated)}} /> · {item.category} · {item.location||"Pantry"}{item.price?" · "+item.price:""}</div>
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
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button style={{...bBtn("ghost"),flex:1}} onClick={()=>{setScanStage("upload");setScanResults(null);}}>← Rescan</button>
                  <button style={{...bBtn("green"),flex:2}} onClick={commitScan}>✅ Save {scanResults.filter(i=>i.selected).length} Items</button>
                </div>
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

