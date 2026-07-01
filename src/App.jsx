// Smart Kitchen App v2.1 - April 26 2026
import React, { useState, useRef, useEffect } from "react"
import { ViewerCodeManager, JoinAsViewerModal } from "./ViewerCodeManager";
import { supabase } from "./supabaseClient";
import "./App.css";

// -- Design tokens -------------------------------------------------------------
// CSS variables handle theming — C provides the var() references for inline styles
const C={
  bg:"var(--sk-bg)",surface:"var(--sk-surface)",card:"var(--sk-card)",cardHover:"var(--sk-card-hover)",
  border:"var(--sk-border)",borderLight:"var(--sk-border-light)",
  accent:"var(--sk-accent)",green:"var(--sk-green)",red:"var(--sk-red)",
  blue:"var(--sk-blue)",purple:"var(--sk-purple)",teal:"var(--sk-teal)",orange:"var(--sk-orange)",
  text:"var(--sk-text)",muted:"var(--sk-muted)",dim:"var(--sk-dim)",
};
const FD="'Cormorant Garamond', serif";
const FB="'DM Sans', sans-serif";
const FM="'JetBrains Mono', monospace";

// -- Constants -----------------------------------------------------------------
const LOCATIONS=["Pantry","Fridge","Freezer"];
const LOC_ICONS={Pantry:"🗄",Fridge:"❄",Freezer:"🧊"};
const LOC_COLORS={Pantry:C.accent,Fridge:C.blue,Freezer:C.purple};
const CATEGORIES=["Protein","Produce","Dairy","Pantry","Grains","Spices","Frozen","Condiments","Snacks","Beverages","Wild Harvest","Home Harvest","Household","Cleaning","Personal Care","Pet","Other"];
const KITCHEN_APPLIANCES=[
  {id:"instant_pot",label:"Instant Pot / Pressure Cooker",emoji:"🫕"},
  {id:"air_fryer",label:"Air Fryer",emoji:"🌬"},
  {id:"slow_cooker",label:"Slow Cooker / Crockpot",emoji:"🫕"},
  {id:"outdoor_grill",label:"Outdoor Grill",emoji:"🔥"},
  {id:"smoker",label:"Smoker",emoji:"🌫"},
  {id:"griddle",label:"Griddle (Blackstone / Electric)",emoji:"🍳"},
  {id:"deep_fryer",label:"Deep Fryer",emoji:"🍟"},
  {id:"rice_cooker",label:"Rice Cooker",emoji:"🍚"},
  {id:"stand_mixer",label:"Stand Mixer / Bread Machine",emoji:"🥐"},
  {id:"sous_vide",label:"Sous Vide",emoji:"🌡"},
  {id:"waffle_iron",label:"Waffle Iron / Sandwich Press",emoji:"🧇"},
  {id:"pizza_oven",label:"Pizza Oven (Ooni / Outdoor)",emoji:"🍕"},
];
const CAT_COLORS={Protein:C.red,Produce:C.green,Dairy:C.blue,Pantry:C.accent,Grains:"#c9a96e",Spices:C.purple,Frozen:"#6be3f0",Condiments:"#94a3b8",Snacks:"#f59e0b",Beverages:"#06b6d4",Household:"#84cc16",Cleaning:"#22d3ee",["Personal Care"]:"#e879f9",Pet:"#fb923c",Other:C.muted,"Wild Harvest":"#5a8a2e","Home Harvest":"#2e8a5a"};
// -- Wild Harvest & Home Harvest -----------------------------------------------
const WILD_SPECIES=[
  {name:"Venison (Steaks)",freezerMonths:9},
  {name:"Venison (Ground)",freezerMonths:4},
  {name:"Venison (Roast)",freezerMonths:9},
  {name:"Venison (Chops)",freezerMonths:9},
  {name:"Duck Breast",freezerMonths:6},
  {name:"Duck (Whole)",freezerMonths:6},
  {name:"Goose (Breast)",freezerMonths:6},
  {name:"Wild Turkey (Breast)",freezerMonths:9},
  {name:"Wild Turkey (Whole)",freezerMonths:12},
  {name:"Pheasant",freezerMonths:9},
  {name:"Grouse",freezerMonths:6},
  {name:"Rabbit",freezerMonths:9},
  {name:"Squirrel",freezerMonths:6},
  {name:"Salmon (Fillets)",freezerMonths:4},
  {name:"Salmon (Whole)",freezerMonths:3},
  {name:"Trout (Fillets)",freezerMonths:6},
  {name:"Walleye (Fillets)",freezerMonths:8},
  {name:"Bass (Fillets)",freezerMonths:6},
  {name:"Bluegill (Cleaned)",freezerMonths:6},
  {name:"Sunfish (Cleaned)",freezerMonths:6},
  {name:"Perch (Fillets)",freezerMonths:6},
  {name:"Crappie (Fillets)",freezerMonths:6},
  {name:"Northern Pike (Fillets)",freezerMonths:6},
  {name:"Catfish (Fillets)",freezerMonths:6},
  {name:"Other Game Bird",freezerMonths:6},
  {name:"Other Fish",freezerMonths:4},
  {name:"Other Wild Game",freezerMonths:6},
];
const HOME_PRODUCE=[
  {name:"Tomatoes (Fresh)",shelfDays:7,storage:"Counter",unitType:"bulk"},
  {name:"Zucchini",shelfDays:5,storage:"Fridge",unitType:"bulk"},
  {name:"Green Beans",shelfDays:5,storage:"Fridge",unitType:"bulk"},
  {name:"Sweet Corn",shelfDays:3,storage:"Fridge",unitType:"bulk"},
  {name:"Bell Peppers",shelfDays:7,storage:"Fridge",unitType:"bulk"},
  {name:"Cucumbers",shelfDays:7,storage:"Fridge",unitType:"bulk"},
  {name:"Butternut Squash",shelfDays:60,storage:"Cool dry",unitType:"bulk"},
  {name:"Acorn Squash",shelfDays:60,storage:"Cool dry",unitType:"bulk"},
  {name:"Kale",shelfDays:5,storage:"Fridge",unitType:"bulk"},
  {name:"Lettuce / Greens",shelfDays:5,storage:"Fridge",unitType:"bulk"},
  {name:"Herbs (Fresh)",shelfDays:7,storage:"Fridge",unitType:"bulk"},
  {name:"Eggs (Backyard)",shelfDays:35,storage:"Fridge",unitType:"dozen",hType:"Produce",hLoc:"Fridge"},
  {name:"Garlic (Cured)",shelfDays:180,storage:"Cool dry",unitType:"bulk"},
  {name:"Onions (Cured)",shelfDays:90,storage:"Cool dry",unitType:"bulk"},
  {name:"Potatoes",shelfDays:60,storage:"Cool dark",unitType:"bulk"},
  {name:"Sweet Potatoes",shelfDays:30,storage:"Cool dry",unitType:"bulk"},
  {name:"Pumpkin",shelfDays:60,storage:"Cool dry",unitType:"bulk"},
  {name:"Canned Tomatoes",shelfDays:540,storage:"Pantry",unitType:"bulk"},
  {name:"Canned Green Beans",shelfDays:540,storage:"Pantry",unitType:"bulk"},
  {name:"Canned Salsa",shelfDays:365,storage:"Pantry",unitType:"bulk"},
  {name:"Frozen Green Beans",shelfDays:270,storage:"Freezer",unitType:"bulk"},
  {name:"Frozen Corn",shelfDays:270,storage:"Freezer",unitType:"bulk"},
  {name:"Frozen Peppers",shelfDays:270,storage:"Freezer",unitType:"bulk"},
  {name:"Broiler Chicken (Whole)",freezerMonths:12,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Broiler Chicken (Cuts)",freezerMonths:9,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Pork (Chops)",freezerMonths:6,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Pork (Roast)",freezerMonths:6,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Ground Pork",freezerMonths:3,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Pork (Belly/Bacon)",freezerMonths:4,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Beef (Steaks)",freezerMonths:9,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Beef (Roast)",freezerMonths:9,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Ground Beef",freezerMonths:4,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Goat",freezerMonths:9,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Lamb",freezerMonths:9,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
  {name:"Raw Milk",shelfDays:7,storage:"Fridge",unitType:"oz",hType:"Produce",hLoc:"Fridge"},
  {name:"Cream",shelfDays:14,storage:"Fridge",unitType:"oz",hType:"Produce",hLoc:"Fridge"},
  {name:"Homemade Butter",shelfDays:30,storage:"Fridge",unitType:"oz",hType:"Produce",hLoc:"Fridge"},
  {name:"Fresh Cheesemaking Cheese",shelfDays:7,storage:"Fridge",unitType:"oz",hType:"Produce",hLoc:"Fridge"},
  {name:"Aged Cheese (Homemade)",shelfDays:90,storage:"Fridge",unitType:"oz",hType:"Produce",hLoc:"Fridge"},
  {name:"Other Garden Produce",shelfDays:5,storage:"Fridge",unitType:"bulk"},
  {name:"Other Preserved",shelfDays:365,storage:"Pantry",unitType:"bulk"},
  {name:"Other Livestock",freezerMonths:6,storage:"Freezer",unitType:"lbs",hType:"Protein",hLoc:"Freezer"},
];
// Measure options for non-bulk Home Harvest items — user-selectable, unitType above is just the starting default
const MEASURE_CONFIG={
  lbs:{label:"TOTAL WEIGHT (lbs)",placeholder:"e.g. 4.5",sizeLabel:"OZ PER PORTION",sizeOptions:[4,5,6,8,16],sizeUnit:"oz",defaultSize:16,calc:(raw,size)=>Math.floor((raw*16)/size),outputUnit:"portions",estimateLine:(raw,size)=>raw+" lbs \u00f7 "+size+"oz each"},
  oz:{label:"TOTAL WEIGHT (oz)",placeholder:"e.g. 24",sizeLabel:"PACKAGE SIZE",sizeOptions:[4,8,16,32],sizeUnit:"oz",defaultSize:8,calc:(raw,size)=>Math.floor(raw/size),outputUnit:"packages",estimateLine:(raw,size)=>raw+"oz \u00f7 "+size+"oz each"},
  each:{label:"TOTAL COUNT",placeholder:"e.g. 18",sizeLabel:null,sizeOptions:null,defaultSize:null,calc:(raw)=>Math.floor(raw),outputUnit:"each",estimateLine:(raw)=>raw+" individually counted"},
  dozen:{label:"TOTAL COUNT",placeholder:"e.g. 30",sizeLabel:null,sizeOptions:null,defaultSize:null,calc:(raw)=>Math.floor(raw/12),outputUnit:"dozen",estimateLine:(raw)=>Math.floor(raw/12)+" dozen from "+raw+" total (\u00f712)"},
};
const HARVEST_YIELD={
  "Tomatoes (Fresh)":{rawUnit:"bushels",outputUnit:{Canned:"quart jars",Frozen:"1-lb bags",Fresh:"lb bags"},rate:{Canned:17,Frozen:38,Fresh:53}},
  "Green Beans":{rawUnit:"bushels",outputUnit:{Canned:"pint jars",Frozen:"1-lb bags",Fresh:"lb bags"},rate:{Canned:15,Frozen:25,Fresh:30}},
  "Sweet Corn":{rawUnit:"dozen ears",outputUnit:{Canned:"pint jars",Frozen:"quart bags",Fresh:"ears"},rate:{Canned:5,Frozen:6,Fresh:12}},
};
const HARVEST_YIELD_DEFAULT={rawUnit:"lbs",outputUnit:{Canned:"jars",Frozen:"1-lb bags",Fresh:"lb bags"},rate:{Canned:0.5,Frozen:1,Fresh:1}};
const getHarvestYield=(name)=>HARVEST_YIELD[name]||HARVEST_YIELD_DEFAULT;
// Simple Levenshtein distance — used to catch near-miss typos (e.g. "Chi8ken Breast") against existing inventory item names
const levenshtein=(a,b)=>{
  a=a.toLowerCase();b=b.toLowerCase();
  const m=a.length,n=b.length;
  if(m===0) return n; if(n===0) return m;
  const d=Array.from({length:m+1},()=>new Array(n+1).fill(0));
  for(let i=0;i<=m;i++) d[i][0]=i;
  for(let j=0;j<=n;j++) d[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++){
    const cost=a[i-1]===b[j-1]?0:1;
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
  }
  return d[m][n];
};
// Returns the closest existing inventory item name if the typed name is a likely typo of it (not an exact match, but close), else null
const findCloseInventoryMatch=(typed,inventory)=>{
  const t=(typed||"").trim();
  if(t.length<3) return null;
  const tl=t.toLowerCase();
  let best=null,bestDist=Infinity;
  (inventory||[]).forEach(i=>{
    const n=(i.name||"").trim();
    if(!n||n.toLowerCase()===tl) return;
    const dist=levenshtein(t,n);
    const maxLen=Math.max(t.length,n.length);
    const threshold=maxLen<=6?1:maxLen<=10?2:3;
    if(dist<=threshold&&dist<bestDist){bestDist=dist;best=n;}
  });
  return best;
};
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
  senior:       {label:"Senior Adult",      color:C.teal,    icon:"👴", flags:["low-sodium","soft-textures","simple-prep","familiar-foods","small-portions"]},
  diabetic:     {label:"Diabetic (Strict)", color:C.blue,    icon:"💉", flags:["zero-sugar","no-white-rice","no-regular-pasta","whole-wheat-only","brown-rice-only","low-carb"]},
  renal:        {label:"Renal/Kidney",      color:C.purple,  icon:"🫘", flags:["low-potassium","low-phosphorus","low-sodium","limit-protein"]},
  diabeticRenal:{label:"Diabetic+Renal",    color:"#f472b6", icon:"⚕", flags:["zero-sugar","no-white-rice","no-regular-pasta","whole-wheat-only","brown-rice-only","low-carb","low-potassium","low-phosphorus","low-sodium","limit-protein"]},
  heartHealthy: {label:"Heart-Healthy",     color:C.red,     icon:"❤", flags:["low-sodium","low-saturated-fat"]},
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
  {id:7,name:"",role:"adult",       restriction:"standard", customParams:{},active:false},
  {id:8,name:"",role:"adult",       restriction:"standard", customParams:{},active:false},
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
// Common medications list for autocomplete
const COMMON_MEDICATIONS=[
  "Acetaminophen","Adderall","Albuterol","Alendronate","Allopurinol","Alprazolam","Amiodarone","Amitriptyline","Amlodipine","Amoxicillin","Amphetamine","Anastrozole","Apixaban","Aspirin","Atenolol","Atorvastatin","Azithromycin","Baclofen","Benazepril","Bupropion","Buspirone","Carvedilol","Cetirizine","Ciprofloxacin","Citalopram","Clonazepam","Clopidogrel","Clonidine","Colchicine","Cyclobenzaprine",
  "Doxycycline","Duloxetine","Eliquis","Enalapril","Escitalopram","Esomeprazole","Ezetimibe","Famotidine","Fenofibrate","Finasteride","Fluoxetine","Fluticasone","Furosemide","Gabapentin","Glipizide","Glipizide","Hydrochlorothiazide","Hydrocodone","Hydroxyzine","Ibuprofen","Insulin Glargine","Insulin Lispro","Isosorbide","Januvia","Lamotrigine","Lansoprazole","Latanoprost","Levetiracetam","Levofloxacin","Levothyroxine",
  "Linagliptin","Lisinopril","Lithium","Loperamide","Loratadine","Lorazepam","Losartan","Lovastatin","Meloxicam","Metformin","Methocarbamol","Methotrexate","Methylphenidate","Metoprolol","Metronidazole","Mirtazapine","Montelukast","Morphine","Naproxen","Nifedipine","Nitroglycerin","Omeprazole","Ondansetron","Oxycodone","Pantoprazole","Paroxetine","Phentermine","Pravastatin","Prednisone","Pregabalin",
  "Propranolol","Quetiapine","Ramipril","Ranitidine","Risperidone","Rivaroxaban","Rosuvastatin","Sertraline","Sitagliptin","Spironolactone","Sulfamethoxazole","Sumatriptan","Tamsulosin","Tiotropium","Topiramate","Tramadol","Trazodone","Trimethoprim","Valacyclovir","Valsartan","Venlafaxine","Verapamil","Warfarin","Xarelto","Zolpidem","Zoloft","Zyrtec"
];

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
function MedAutoComplete({value,onChange}){
  const [open,setOpen]=React.useState(false);
  const [query,setQuery]=React.useState(value||"");
  const ref=React.useRef(null);
  React.useEffect(()=>{setQuery(value||"");},[value]);
  React.useEffect(()=>{
    const handler=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);
  const matches=query.length>=2?COMMON_MEDICATIONS.filter(d=>d.toLowerCase().includes(query.toLowerCase())).slice(0,8):[];
  const isDark=document.body.classList.contains("sk-dark");
  const inputStyle={width:"100%",background:isDark?"#1e1e2e":"#fff",border:"1px solid "+(isDark?"#333":"#ddd"),borderRadius:6,padding:"6px 10px",color:isDark?"#e2e8f0":"#1a1a1a",fontFamily:"'JetBrains Mono',monospace",fontSize:12,boxSizing:"border-box",outline:"none"};
  const dropStyle={position:"absolute",top:"100%",left:0,right:0,background:isDark?"#1e1e2e":"#fff",border:"1px solid "+(isDark?"#444":"#ddd"),borderRadius:6,zIndex:50,marginTop:2,boxShadow:"0 4px 12px rgba(0,0,0,0.15)",maxHeight:220,overflowY:"auto"};
  const itemStyle=(hov)=>({padding:"8px 12px",cursor:"pointer",fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:isDark?"#e2e8f0":"#1a1a1a",background:hov?(isDark?"#2d2d3f":"#f0f4ff"):"transparent",borderBottom:"1px solid "+(isDark?"#2a2a3a":"#f0f0f0")});
  return(
    <div ref={ref} style={{position:"relative",flex:1}}>
      <input
        style={inputStyle}
        placeholder="Medication name..."
        value={query}
        onChange={e=>{setQuery(e.target.value);onChange(e.target.value);setOpen(true);}}
        onFocus={()=>{if(query.length>=2)setOpen(true);}}
        autoComplete="off"
      />
      {open&&matches.length>0&&(
        <div style={dropStyle}>
          {matches.map(drug=>(
            <div key={drug}
              style={itemStyle(false)}
              onMouseEnter={e=>e.currentTarget.style.background=isDark?"#2d2d3f":"#f0f4ff"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              onMouseDown={e=>{e.preventDefault();setQuery(drug);onChange(drug);setOpen(false);}}>
              {drug}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
const bInp={background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"9px 13px",color:C.text,fontFamily:FM,fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"};
const Label=({children})=><div style={{fontSize:10,color:C.muted,fontFamily:FM,letterSpacing:0.8,marginBottom:5}}>{children}</div>;

// -- Claude API ----------------------------------------------------------------
async function callClaude({system,prompt,imageBase64,imageB64,imageType,extraImages=[],maxTokens=4000}){
  const content=[];
  const primaryImg=imageBase64||imageB64;
  if(primaryImg) content.push({type:"image",source:{type:"base64",media_type:imageType||"image/jpeg",data:primaryImg}});
  (extraImages||[]).forEach(img=>content.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:img}}));
  content.push({type:"text",text:prompt});
  const apiKey=import.meta.env?.VITE_ANTHROPIC_API_KEY||"";
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:maxTokens,system,messages:[{role:"user",content}]}),
    signal:AbortSignal.timeout(60000),
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
const loadLocal=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};


// -- Occasion System ---------------------------------------------------------
const OCCASION_EVENT_TYPES=[
  {key:"quick",  label:"Quick",       emoji:"⚡", desc:"30 min or less"},
  {key:"casual", label:"Casual",      emoji:"🍽", desc:"Weeknight comfort"},
  {key:"formal", label:"Formal",      emoji:"✨", desc:"Elevated presentation"},
  {key:"party",  label:"Dinner Party",emoji:"🥂", desc:"Scaled for 6-8+"},
  {key:"popup",  label:"Pop Up",      emoji:"🎉", desc:"Spontaneous & fun"}
];
const OCCASION_AUDIENCE_TYPES=[
  {key:"family",   label:"Family",        emoji:"👨\u200d👩\u200d👧\u200d👦"},
  {key:"kids",     label:"Kids Party",    emoji:"🧒"},
  {key:"adult",    label:"Date Night",    emoji:"💑"},
  {key:"mixed",    label:"Mixed Crowd",   emoji:"🎊"},
  {key:"adults",   label:"Adults Party",  emoji:"🍻"}
];
const OCCASION_BUDGETS=["Under $30","$30–$60","$60–$100","No limit"];
function buildOccasionContext(occ){
  if(!occ||!occ.eventType) return "";
  const ev=OCCASION_EVENT_TYPES.find(e=>e.key===occ.eventType);
  const au=OCCASION_AUDIENCE_TYPES.find(a=>a.key===occ.audienceType);
  let ctx="OCCASION CONTEXT: ";
  if(ev) ctx+=ev.emoji+" "+ev.label+" ("+ev.desc+"). ";
  if(au) ctx+="Audience: "+au.emoji+" "+au.label+". ";
  if(occ.headCount) ctx+="Head count: "+occ.headCount+" people. ";
  if(occ.mode==="use") ctx+="Mode: Use What I Have — maximize on-hand inventory. ";
  else if(occ.mode==="surprise") ctx+="Mode: Surprise Me. "+(occ.budget?"Budget: "+occ.budget+". ":"");
  if(occ.guestRestrictions) ctx+="Guest dietary notes: "+occ.guestRestrictions+". ";
  if(occ.note) ctx+="Special request: "+occ.note+". ";
  if(occ.eventType==="party") ctx+="Include make-ahead tips and scale ingredients. Separate occasion items on shopping list. ";
  if(occ.eventType==="quick") ctx+="HARD LIMIT: meal must be completable in 30 minutes or less. ";
  if(occ.audienceType==="kids") ctx+="No alcohol pairings. Allergen flags prominent. Fun presentation encouraged. ";
  if(occ.audienceType==="adult") ctx+="Adults only (21+). Intimate dinner for 2. Suggest wine or cocktail pairing. Romantic elevated presentation. Candle-worthy plating. ";
  if(occ.audienceType==="adults") ctx+="Adults-only group party (21+). Scale for the head count. Beer, wine, and cocktail-friendly food — finger foods, shareable dishes, and crowd-pleasing options welcome. No kids meal framing. ";
  if(occ.includeDrinks) ctx+="DRINK PAIRINGS REQUIRED: Populate the drinkPairings JSON field with 2-3 specific wine, beer, or cocktail suggestions that complement this meal, each with one sentence on why it works. Do not add drink info to description field. ";
  if(occ.audienceType==="adult"&&!occ.includeDrinks) ctx+="This is a Date Night \xe2\x80\x94 include a wine pairing suggestion that complements the meal. ";
  return ctx;
}
// -- Proactive Feature Announcements Registry ---------------------------------
const FEATURE_ANNOUNCEMENTS=[
  {
    key:"occasionSystem",
    title:"New: Occasion Planner",
    intro:(name)=>`Hi ${name}! ✨ I have something exciting to show you.\n\nWe just added the **Occasion Planner** — now you can plan meals for Dinner Parties, Date Nights, Kids Parties, Quick Weeknights, and more. Just pick your event type and audience and Smart Kitchen handles the rest.\n\nWant me to walk you through it?`,
    quickReplies:["Show me!","How does it work?","Maybe later"],
    tab:"mealPlan"
  },
  {
    key:"smsShoppingList",
    title:"New: Text Your Shopping List",
    intro:(name)=>`Hey ${name}! 💬 Quick heads up — you can now text your shopping list directly to your phone or your spouse’s phone with one tap.\n\nNo email app needed. Just add a phone number in Settings and you’re all set.\n\nWant me to show you where?`,
    quickReplies:["Yes, show me","I’ll find it","Not right now"],
    tab:"shopping"
  }
];
// VOICE PICKER COMPONENT — memoized to prevent flicker on re-render
const VoicePicker=React.memo(()=>{
  const [availVoices,setAvailVoices]=React.useState([]);
  const [selVoice,setSelVoice]=React.useState(()=>{try{return localStorage.getItem("sk_voiceName")||"";}catch{return "";}});
  const [gender,setGender]=React.useState(()=>{try{return localStorage.getItem("sk_voiceGender")||"female";}catch{return "female";}});
  React.useEffect(()=>{
    const load=()=>{
      const v=window.speechSynthesis.getVoices();
      if(v&&v.length>0){
        const en=v.filter(x=>x.lang&&x.lang.startsWith("en"));
        setAvailVoices(en);
        if(!localStorage.getItem("sk_voiceName")&&en.length>0){
          const us=en.find(x=>x.lang==="en-US")||en[0];
          if(us){setSelVoice(us.name);localStorage.setItem("sk_voiceName",us.name);}
        }
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged=load;
    return()=>{window.speechSynthesis.onvoiceschanged=null;};
  },[]);
  const prettyName=(v)=>{
    const n=v.name.replace("Google ","").replace("Microsoft ","");
    const loc={en_US:"🇺🇸 US",en_GB:"🇬🇧 UK","en-US":"🇺🇸 US","en-GB":"🇬🇧 UK","en-AU":"🇦🇺 AU","en-IN":"🇮🇳 IN","en-NG":"🇳🇬 NG"};
    const flag=loc[v.lang.replace("_","-")]||v.lang;
    return flag+" "+n;
  };
  if(availVoices.length===0) return null;
  return(<div style={{marginBottom:10}}>
    {availVoices.length>1&&(<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
      {availVoices.map(v=>(<button key={v.name} onClick={()=>{setSelVoice(v.name);localStorage.setItem("sk_voiceName",v.name);}} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+(selVoice===v.name?"#C8963E":"#555"),background:selVoice===v.name?"#fff7ed":"transparent",color:selVoice===v.name?"#C8963E":C.muted,fontFamily:FM,fontSize:11,cursor:"pointer",fontWeight:selVoice===v.name?700:400}}>{prettyName(v)}</button>))}
    </div>)}
    <div style={{fontSize:11,color:C.muted,fontFamily:FM,marginBottom:8}}>Tone</div>
    <div style={{display:"flex",gap:6,marginBottom:8}}>
      {[["female","👩 Higher pitch"],["male","👨 Deeper pitch"]].map(([g,label])=>(
        <button key={g} onClick={()=>{setGender(g);localStorage.setItem("sk_voiceGender",g);}} style={{flex:1,padding:"7px",borderRadius:8,border:"1px solid "+(gender===g?"#C8963E":"#555"),background:gender===g?"#fff7ed":"transparent",color:gender===g?"#C8963E":C.muted,fontFamily:FM,fontSize:11,cursor:"pointer",fontWeight:gender===g?700:400}}>{label}</button>
      ))}
    </div>
  </div>);
});

// -- Nutrition Dashboard Component ------------------------------------------
function NutritionDashboard({familyProfiles,user,supabase,seniorMode,C,FM,FD,refreshKey}){
  const [todayLog,setTodayLog]=React.useState([]);
  const [weekLog,setWeekLog]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [expanded,setExpanded]=React.useState(true);
  const [showWeekly,setShowWeekly]=React.useState(false);
  const [narrative,setNarrative]=React.useState("");
  const [narrativeLoading,setNarrativeLoading]=React.useState(false);
  const [reportSending,setReportSending]=React.useState(false);
  const [reportSent,setReportSent]=React.useState(false);
  const [showEmailConfirm,setShowEmailConfirm]=React.useState(false);
  const [reportEmail,setReportEmail]=React.useState("");
  const [selectedMember,setSelectedMember]=React.useState(null);// null = show all (single member) or first member; string = member name filter
  React.useEffect(()=>{
    if(!user?.id) return;
    const today=new Date();today.setHours(0,0,0,0);
    const sevenDaysAgo=new Date(today);sevenDaysAgo.setDate(sevenDaysAgo.getDate()-6);
    supabase.from("nutrition_log")
      .select("*")
      .eq("user_id",user.id)
      .gte("logged_at",today.toISOString())
      .order("logged_at",{ascending:false})
      .then(({data})=>{
        setTodayLog(data||[]);
        setLoading(false);
      });
    supabase.from("nutrition_log")
      .select("*")
      .eq("user_id",user.id)
      .gte("logged_at",sevenDaysAgo.toISOString())
      .order("logged_at",{ascending:true})
      .then(({data})=>setWeekLog(data||[]));
  },[user?.id,refreshKey]);
  const allQualifying=familyProfiles.filter(p=>p.guidedPlateMode||p.medicalPlan);
  // Filter log by selected member when multiple members exist
  const filteredLog=allQualifying.length>1&&selectedMember
    ?todayLog.filter(r=>r.member_name===selectedMember)
    :todayLog;
  const totals=filteredLog.reduce((acc,r)=>{
    acc.calories+=(r.calories||0);
    acc.protein_g+=(r.protein_g||0);
    acc.carbs_g+=(r.carbs_g||0);
    acc.sat_fat_g+=(r.sat_fat_g||0);
    acc.fiber_g+=(r.fiber_g||0);
    acc.ww_points+=(r.ww_points||0);
    return acc;
  },{calories:0,protein_g:0,carbs_g:0,sat_fat_g:0,fiber_g:0,ww_points:0});
  // Targets come from the selected member profile
  const activeP=selectedMember
    ?(allQualifying.find(p=>p.name===selectedMember)||allQualifying[0]||(familyProfiles[0]||null))
    :(allQualifying.length>0?allQualifying[0]:(familyProfiles[0]||null));
  const targets={
    protein_g:activeP?.proteinTargetG||75,
    calories:1800,
    carbs_g:130,
    sat_fat_g:20,
    fiber_g:25,
    ww_points:activeP?.wwPointsBudget||null,
  };
  const bar=(val,target,color)=>{
    const pct=Math.min(100,Math.round((val/target)*100));
    const over=val>target;
    return(
      <div style={{background:C.surface,borderRadius:4,height:8,overflow:"hidden",flex:1}}>
        <div style={{width:pct+"%",height:"100%",background:over?"#dc2626":pct>85?"#f59e0b":color,borderRadius:4,transition:"width 0.4s"}}/>
      </div>
    );
  };
  const rows=[
    {label:"Protein",key:"protein_g",unit:"g",color:"#3b82f6",target:targets.protein_g},
    {label:"Calories",key:"calories",unit:"cal",color:"#f59e0b",target:targets.calories},
    {label:"Carbs",key:"carbs_g",unit:"g",color:"#22c55e",target:targets.carbs_g},
    {label:"Sat. Fat",key:"sat_fat_g",unit:"g",color:"#ef4444",target:targets.sat_fat_g},
    {label:"Fiber",key:"fiber_g",unit:"g",color:"#8b5cf6",target:targets.fiber_g},
  ];
  if(targets.ww_points) rows.push({label:"WW Points",key:"ww_points",unit:"pts",color:"#7c3aed",target:targets.ww_points});
  if(loading) return null;
  return(
    <div style={{background:C.card,borderRadius:14,padding:16,marginBottom:18,border:"1px solid #3b82f644"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:expanded?14:0,cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <div>
          <div style={{fontFamily:FD,fontSize:seniorMode?18:14,color:"#3b82f6",fontWeight:700}}>📊 Today's Nutrition{selectedMember?(" — "+selectedMember):allQualifying.length>1?(" — "+allQualifying.map(p=>p.name||"Member").join(" & ")):(activeP?.name?" — "+activeP.name:"")}</div>{allQualifying.length>1&&(<div><div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{allQualifying.map(p=>{const isSelected=selectedMember===p.name;return(<button key={p.id||p.name} onClick={e=>{e.stopPropagation();setSelectedMember(isSelected?null:p.name);}} style={{fontFamily:FM,fontSize:10,background:isSelected?"#3b82f6":"#3b82f622",border:"1px solid "+(isSelected?"#3b82f6":"#3b82f644"),borderRadius:12,padding:"3px 10px",color:isSelected?"#fff":"#3b82f6",cursor:"pointer",fontWeight:isSelected?700:400}}>{p.name||"Member"}{p.medicalPlan?" · "+p.medicalPlan:(p.guidedPlateMode?" · Guided":"")}</button>);})}</div>{selectedMember&&<div style={{fontFamily:FM,fontSize:10,color:"#3b82f6",marginTop:3}}>Showing {selectedMember} only • tap badge to clear</div>}</div>)}          <div style={{fontFamily:FM,fontSize:10,color:C.muted,marginTop:2}}>{selectedMember?filteredLog.length:todayLog.length} items logged today{!selectedMember&&allQualifying.length>1?" • "+allQualifying.length+" members – tap a name to filter":""} • tap to {expanded?"collapse":"expand"}</div>
        </div>
        <div style={{fontFamily:FD,fontSize:22,color:totals.protein_g>=targets.protein_g*0.9?"#22c55e":"#f59e0b"}}>
          {Math.round(totals.protein_g)}g
        </div>
      </div>
      {expanded&&(
        <div>
          {rows.map(r=>(
            <div key={r.key} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontFamily:FM,fontSize:seniorMode?14:11,color:C.muted}}>{r.label}</div>
                <div style={{fontFamily:FM,fontSize:seniorMode?14:11,color:totals[r.key]>r.target?"#dc2626":r.color,fontWeight:700}}>
                  {Math.round(totals[r.key])}{r.unit} / {r.target}{r.unit}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {bar(totals[r.key],r.target,r.color)}
                <div style={{fontFamily:FM,fontSize:10,color:C.muted,minWidth:32,textAlign:"right"}}>
                  {Math.min(100,Math.round((totals[r.key]/r.target)*100))}%
                </div>
              </div>
            </div>
          ))}
          <div style={{fontFamily:FM,fontSize:10,color:C.muted,marginTop:8,borderTop:"1px solid "+C.border,paddingTop:8}}>
            For guidance only. Consult your healthcare provider for specific dietary recommendations.
          </div>
          {allQualifying.length>1&&(<div style={{marginTop:12,borderTop:"1px solid "+C.border,paddingTop:10}}><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:6,letterSpacing:0.8}}>PLATE ASSIST ACTIVE</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{allQualifying.map(p=>{const pTarget=p.proteinTargetG||75;const pLogged=todayLog.filter(r=>r.member_name===p.name).reduce((a,r)=>a+(r.protein_g||0),0);const pMet=pLogged>=pTarget*0.9;const isActiveMember=!selectedMember||selectedMember===p.name;return(<button key={p.id||p.name} onClick={()=>setSelectedMember(selectedMember===p.name?null:p.name)} style={{background:pMet?"#22c55e18":"#f59e0b18",border:"2px solid "+(selectedMember===p.name?(pMet?"#22c55e":"#f59e0b"):(pMet?"#22c55e44":"#f59e0b44")),borderRadius:10,padding:"6px 10px",minWidth:120,cursor:"pointer",opacity:isActiveMember?1:0.4,textAlign:"left"}}><div style={{fontFamily:FM,fontSize:11,color:pMet?"#22c55e":"#f59e0b",fontWeight:700}}>{p.name||"Member"}</div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginTop:2}}>{Math.round(pLogged)}g / {pTarget}g protein{p.medicalPlan?" · "+p.medicalPlan:""}</div></button>);})}</div></div>)}<div style={{display:"flex",gap:8,marginTop:12}}><button onClick={()=>{setShowWeekly(w=>!w);if(!narrative&&weekLog.length>0){setNarrativeLoading(true);const mn=selectedMember||(allQualifying[0]?.name||"member");const wk=weekLog.filter(r=>!selectedMember||r.member_name===selectedMember);const days={};wk.forEach(r=>{const d=r.logged_at?.slice(0,10)||"";if(!days[d])days[d]={p:0,c:0,cal:0,s:0,f:0,n:0};days[d].p+=r.protein_g||0;days[d].cal+=r.calories||0;days[d].c+=r.carbs_g||0;days[d].s+=r.sat_fat_g||0;days[d].f+=r.fiber_g||0;days[d].n++;});const dayArr=Object.entries(days);const avgP=dayArr.length?Math.round(dayArr.reduce((a,[,v])=>a+v.p,0)/dayArr.length):0;const target=activeP?.proteinTargetG||75;const metDays=dayArr.filter(([,v])=>v.p>=target*0.9).length;setNarrative("Over the past 7 days, "+mn+" logged "+dayArr.length+" days of nutrition data. Average daily protein: "+avgP+"g (target: "+target+"g). Protein target met "+metDays+" of "+dayArr.length+" days tracked. Keep focusing on protein-first meals to stay on track.");setNarrativeLoading(false);}}} style={{flex:1,background:showWeekly?"#1A2344":"transparent",border:"1px solid #1A2344",borderRadius:8,padding:"8px 12px",color:showWeekly?"#C8963E":"#888",fontFamily:FM,fontSize:seniorMode?14:11,fontWeight:600,cursor:"pointer"}}>📈 7-Day Trend</button><button onClick={()=>{const email=user?.email||user?.user_metadata?.email||"";setReportEmail(email);setShowEmailConfirm(true);}} style={{flex:1,background:reportSent?"#10b981":"transparent",border:"1px solid "+(reportSent?"#10b981":"#C8963E"),borderRadius:8,padding:"8px 12px",color:reportSent?"#fff":"#C8963E",fontFamily:FM,fontSize:seniorMode?14:11,fontWeight:600,cursor:"pointer",opacity:reportSending?0.6:1}}>{reportSending?"⏳ Sending...":reportSent?"✅ Sent!":"📧 Email Report"}</button>{showEmailConfirm&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:24}} onClick={()=>setShowEmailConfirm(false)}><div style={{background:C.card,borderRadius:16,padding:24,width:"100%",maxWidth:400,border:"1px solid #C8963E"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:18,color:"#C8963E",marginBottom:12}}>📧 Send Nutrition Report</div><div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>Your 7-day nutrition report will be emailed to the address below. Confirm it is correct before sending.</div><div style={{fontFamily:FM,fontSize:11,color:"#888",marginBottom:4,letterSpacing:0.8}}>SEND REPORT TO</div><input value={reportEmail} onChange={e=>setReportEmail(e.target.value)} placeholder="your@email.com" style={{width:"100%",background:C.surface,border:"1px solid #C8963E",borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:FM,fontSize:14,boxSizing:"border-box",marginBottom:8}}/><div style={{fontFamily:FM,fontSize:10,color:"#555",marginBottom:16}}>This report contains personal nutrition data. Only send to yourself or an authorized care provider. Smart Kitchen does not share your data with third parties.</div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowEmailConfirm(false)} style={{flex:1,background:"transparent",border:"1px solid #555",borderRadius:8,padding:"10px",color:"#888",fontFamily:FM,fontSize:13,cursor:"pointer"}}>Cancel</button><button onClick={async()=>{if(!reportEmail.trim()||!reportEmail.includes("@")){alert("Please enter a valid email address.");return;}setShowEmailConfirm(false);setReportSending(true);setReportSent(false);const mn=selectedMember||(allQualifying[0]?.name||"Member");const wk2=weekLog.filter(r=>!selectedMember||r.member_name===mn);const days2={};wk2.forEach(r=>{const d=r.logged_at?.slice(0,10)||"";if(!days2[d])days2[d]={date:d,protein_g:0,calories:0,carbs_g:0,sat_fat_g:0,fiber_g:0};days2[d].protein_g+=Math.round(r.protein_g||0);days2[d].calories+=Math.round(r.calories||0);days2[d].carbs_g+=Math.round(r.carbs_g||0);days2[d].sat_fat_g+=Math.round(r.sat_fat_g||0);days2[d].fiber_g+=Math.round(r.fiber_g||0);});const dayArr2=Object.values(days2).sort((a,b)=>a.date.localeCompare(b.date));const n2=dayArr2.length||1;const avgs2={protein_g:Math.round(dayArr2.reduce((a,d)=>a+d.protein_g,0)/n2),calories:Math.round(dayArr2.reduce((a,d)=>a+d.calories,0)/n2),carbs_g:Math.round(dayArr2.reduce((a,d)=>a+d.carbs_g,0)/n2),sat_fat_g:Math.round(dayArr2.reduce((a,d)=>a+d.sat_fat_g,0)/n2),fiber_g:Math.round(dayArr2.reduce((a,d)=>a+d.fiber_g,0)/n2)};try{const resp=await fetch("/api/send-shopping-list",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"nutrition-report",toEmail:reportEmail.trim(),memberName:mn,dateRange:"Last 7 Days",dailyData:dayArr2.map(d=>({...d,date:new Date(d.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})})),weeklyAvgs:avgs2,narrative:narrative||""})});const rdata=await resp.json().catch(()=>({}));if(resp.ok&&rdata.success){setReportSent(true);setTimeout(()=>setReportSent(false),5000);}else{alert("Send failed: "+(rdata.error||"Server error "+resp.status)+". Please try again.");}}catch(e){alert("Network error: "+e.message);}setReportSending(false);}} style={{flex:2,background:"#C8963E",border:"none",borderRadius:8,padding:"10px",color:"#000",fontFamily:FM,fontSize:13,fontWeight:700,cursor:"pointer"}}>{reportSending?"⏳ Sending...":"Send Report ➜"}</button></div></div></div>)}</div>{showWeekly&&weekLog.length>0&&(()=>{const mn=selectedMember||(allQualifying[0]?.name||null);const wk=weekLog.filter(r=>!mn||r.member_name===mn);const days={};wk.forEach(r=>{const d=r.logged_at?.slice(0,10)||"";if(!days[d])days[d]={p:0,cal:0,c:0,s:0,f:0};days[d].p+=r.protein_g||0;days[d].cal+=r.calories||0;days[d].c+=r.carbs_g||0;days[d].s+=r.sat_fat_g||0;days[d].f+=r.fiber_g||0;});const dayArr=Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0]));const maxP=Math.max(...dayArr.map(([,v])=>v.p),targets.protein_g);return(<div style={{marginTop:12,background:C.surface,borderRadius:10,padding:12}}><div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:8,letterSpacing:0.8}}>7-DAY PROTEIN TREND</div><div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>{dayArr.map(([date,v])=>{const pct=Math.min(100,(v.p/maxP)*100);const met=v.p>=targets.protein_g*0.9;const label=new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});return(<div key={date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{fontFamily:FM,fontSize:8,color:met?"#22c55e":"#888"}}>{Math.round(v.p)}g</div><div style={{width:"100%",height:pct+"%",minHeight:4,background:met?"#22c55e":"#f59e0b",borderRadius:"3px 3px 0 0",transition:"height 0.4s"}}></div><div style={{fontFamily:FM,fontSize:8,color:"#555"}}>{label}</div></div>);})}</div><div style={{borderTop:"1px dashed #333",marginTop:4,paddingTop:4,fontFamily:FM,fontSize:9,color:"#555"}}>Target: {targets.protein_g}g/day</div>{narrative&&<div style={{marginTop:10,background:"#10b98118",border:"1px solid #10b98133",borderRadius:8,padding:"8px 12px"}}><div style={{fontFamily:FM,fontSize:10,color:"#10b981",fontWeight:700,marginBottom:4}}>Weekly Summary</div><div style={{fontFamily:FM,fontSize:11,color:"#ccc",lineHeight:1.6}}>{narrativeLoading?"⏳ Generating...":narrative}</div></div>}</div>);})()}
        </div>
      )}
    </div>
  );
}

// -- Food Journal Component -------------------------------------------------
function FoodJournal({user,supabase,familyProfiles,can,seniorMode,C,FM,FD,
  journalMember,setJournalMember,journalMealType,setJournalMealType,
  journalFoodName,setJournalFoodName,journalWeight,setJournalWeight,
  journalWeightUnit,setJournalWeightUnit,journalDateTime,setJournalDateTime,
  journalNutrition,setJournalNutrition,journalCalcLoading,setJournalCalcLoading,
  journalSaving,setJournalSaving,journalSuccess,setJournalSuccess,
  journalRecentItems,setJournalRecentItems,
  logNutrition,callClaude,onSaved,onClose
}){
  const allQualifying=familyProfiles.filter(p=>p.guidedPlateMode||p.medicalPlan||p.guidedPlateMode!==undefined);
  const members=allQualifying.length>0?allQualifying:familyProfiles;
  const activeMember=journalMember||(members[0]||null);
  const mealTypes=["Breakfast","Morning Snack","Lunch","Afternoon Snack","Dinner","Evening Snack","Water/Hydration","Protein Shake","Other"];
  const weightUnits=["oz","g","ml","fl oz","lbs","cups"];
  const toGrams=(val,unit)=>{
    const v=parseFloat(val)||0;
    if(unit==="g") return v;
    if(unit==="oz") return v*28.3495;
    if(unit==="lbs") return v*453.592;
    if(unit==="ml") return v;
    if(unit==="fl oz") return v*29.5735;
    if(unit==="cups") return v*236.588;
    return v;
  };
  const estimateNutrition=async()=>{
    if(!journalFoodName.trim()||!journalWeight) return;
    setJournalCalcLoading(true);setJournalNutrition(null);
    try{
      const grams=toGrams(journalWeight,journalWeightUnit);
      const raw=await callClaude({
        system:"Nutrition AI. Return ONLY valid JSON: {calories,protein_g,carbs_g,fat_g,sat_fat_g,sugar_g,fiber_g,sodium_mg,notes}. Numbers only, no units.",
        prompt:"Estimate nutrition for "+grams.toFixed(0)+"g ("+journalWeight+journalWeightUnit+") of "+journalFoodName.trim()+". Return JSON only.",
        maxTokens:200
      });
      if(!raw){setJournalCalcLoading(false);return;}
      const text=typeof raw==="string"?raw:Array.isArray(raw?.content)?raw.content.map(b=>b.text||"").join(""):raw?.content?.[0]?.text||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{");const e=clean.lastIndexOf("}");
      if(s!==-1&&e!==-1){try{setJournalNutrition(JSON.parse(clean.slice(s,e+1)));}catch{}}
    }catch{}
    setJournalCalcLoading(false);
  };
  const saveEntry=async()=>{
    if(!journalFoodName.trim()) return;
    setJournalSaving(true);
    const grams=toGrams(journalWeight||0,journalWeightUnit);
    const wwBudget=activeMember?.wwPointsBudget;
    const wwPts=wwBudget&&journalNutrition?Math.max(0,Math.round(
      ((journalNutrition.calories||0)*0.0305)+
      ((journalNutrition.sat_fat_g||0)*0.275)+
      ((journalNutrition.sugar_g||0)*0.12)-
      ((journalNutrition.protein_g||0)*0.098)
    )):null;
    await logNutrition({
      memberName:activeMember?.name||null,
      itemName:journalFoodName.trim(),
      weightG:grams||null,
      loggedAt:journalDateTime?new Date(journalDateTime).toISOString():new Date().toISOString(),
      calories:journalNutrition?.calories||null,
      protein_g:journalNutrition?.protein_g||null,
      carbs_g:journalNutrition?.carbs_g||null,
      fat_g:journalNutrition?.fat_g||null,
      sat_fat_g:journalNutrition?.sat_fat_g||null,
      sugar_g:journalNutrition?.sugar_g||null,
      fiber_g:journalNutrition?.fiber_g||null,
      sodium_mg:journalNutrition?.sodium_mg||null,
      wwPoints:wwPts,
      source:"food_journal",
      sessionId:journalMealType,
    });
    try{
      const recent=JSON.parse(localStorage.getItem("sk_journalRecent")||"[]");
      const updated=[journalFoodName.trim(),...recent.filter(r=>r!==journalFoodName.trim())].slice(0,10);
      localStorage.setItem("sk_journalRecent",JSON.stringify(updated));
      setJournalRecentItems(updated);
    }catch{}
    setJournalSaving(false);
    setJournalSuccess(true);
    if(onSaved) onSaved();
    setJournalFoodName("");
    setJournalWeight("");
    setJournalNutrition(null);
    setTimeout(()=>setJournalSuccess(false),2500);
  };
  React.useEffect(()=>{
    try{const r=JSON.parse(localStorage.getItem("sk_journalRecent")||"[]");setJournalRecentItems(r);}catch{}
    const now=new Date();
    const pad=n=>String(n).padStart(2,"0");
    setJournalDateTime(now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate())+"T"+pad(now.getHours())+":"+pad(now.getMinutes()));
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:700,padding:"0 0 0 0"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:FD,fontSize:seniorMode?22:18,color:"#10b981",fontWeight:700}}>
            📗 Food Journal
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid #555",borderRadius:8,padding:"6px 14px",color:"#888",fontFamily:FM,fontSize:13,cursor:"pointer"}}>Close</button>
        </div>
        {members.length>1&&(
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:6,letterSpacing:0.8}}>LOGGING FOR</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {members.map(p=>(
                <button key={p.id||p.name} onClick={()=>setJournalMember(p)}
                  style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(activeMember?.name===p.name?"#10b981":"#444"),
                  background:activeMember?.name===p.name?"#10b98122":"transparent",
                  color:activeMember?.name===p.name?"#10b981":"#888",
                  fontFamily:FM,fontSize:seniorMode?15:12,cursor:"pointer",fontWeight:activeMember?.name===p.name?700:400}}>
                  {p.name||"Member"}
                  {p.medicalPlan?" · "+p.medicalPlan:""}
                  {p.bariatricPhase?" · "+p.bariatricPhase+" phase":""}
                </button>
              ))}
            </div>
            {activeMember?.bariatricPhase&&(
              <div style={{background:"#dc262618",border:"1px solid #dc262644",borderRadius:8,padding:"6px 12px",marginTop:8,fontFamily:FM,fontSize:11,color:"#dc2626"}}>
                ⚠ {activeMember.bariatricPhase} phase: max {activeMember.bariatricPhase==="Liquid"?"2 oz":activeMember.bariatricPhase==="Pureed"?"4 oz":activeMember.bariatricPhase==="Soft"?"6 oz":"8 oz"} per sitting
              </div>
            )}
          </div>
        )}
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:6,letterSpacing:0.8}}>MEAL TYPE</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {mealTypes.map(mt=>(
              <button key={mt} onClick={()=>setJournalMealType(mt)}
                style={{padding:"4px 10px",borderRadius:16,border:"1px solid "+(journalMealType===mt?"#10b981":"#333"),
                background:journalMealType===mt?"#10b98122":"transparent",
                color:journalMealType===mt?"#10b981":"#666",
                fontFamily:FM,fontSize:seniorMode?13:10,cursor:"pointer"}}>
                {mt}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:4,letterSpacing:0.8}}>DATE & TIME</div>
          <input type="datetime-local" value={journalDateTime} onChange={e=>setJournalDateTime(e.target.value)}
            style={{width:"100%",background:C.surface,border:"1px solid #444",borderRadius:8,padding:"10px 12px",color:C.text,fontFamily:FM,fontSize:seniorMode?15:13,boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:4,letterSpacing:0.8}}>WHAT DID YOU EAT OR DRINK?</div>
          <input value={journalFoodName} onChange={e=>{setJournalFoodName(e.target.value);setJournalNutrition(null);}}
            placeholder="e.g. Protein shake, Chicken broth, Greek yogurt..."
            style={{width:"100%",background:C.surface,border:"1px solid #444",borderRadius:8,padding:"12px 14px",color:C.text,fontFamily:FM,fontSize:seniorMode?16:14,boxSizing:"border-box"}}/>
          {journalRecentItems.length>0&&!journalFoodName&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6}}>
              <span style={{fontFamily:FM,fontSize:10,color:"#555",alignSelf:"center"}}>Recent:</span>
              {journalRecentItems.slice(0,6).map(item=>(
                <button key={item} onClick={()=>setJournalFoodName(item)}
                  style={{padding:"2px 8px",borderRadius:10,border:"1px solid #333",background:"transparent",color:"#666",fontFamily:FM,fontSize:10,cursor:"pointer"}}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{marginBottom:16,display:"grid",gridTemplateColumns:"1fr auto",gap:8}}>
          <div>
            <div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:4,letterSpacing:0.8}}>AMOUNT (OPTIONAL)</div>
            <input type="number" value={journalWeight} onChange={e=>{setJournalWeight(e.target.value);setJournalNutrition(null);}}
              placeholder="e.g. 4"
              style={{width:"100%",background:C.surface,border:"1px solid #444",borderRadius:8,padding:"10px 12px",color:C.text,fontFamily:FM,fontSize:seniorMode?16:14,boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:4,letterSpacing:0.8}}>UNIT</div>
            <select value={journalWeightUnit} onChange={e=>setJournalWeightUnit(e.target.value)}
              style={{background:C.surface,border:"1px solid #444",borderRadius:8,padding:"10px 12px",color:C.text,fontFamily:FM,fontSize:seniorMode?15:13,cursor:"pointer"}}>
              {weightUnits.map(u=>(<option key={u} value={u}>{u}</option>))}
            </select>
          </div>
        </div>
        {journalFoodName.trim()&&journalWeight&&(
          <button onClick={estimateNutrition} disabled={journalCalcLoading}
            style={{width:"100%",background:"#f59e0b",border:"none",borderRadius:10,padding:seniorMode?"14px":"10px",
            color:"#000",fontFamily:FM,fontSize:seniorMode?17:13,fontWeight:700,cursor:"pointer",marginBottom:12,opacity:journalCalcLoading?0.6:1}}>
            {journalCalcLoading?"⏳ Estimating...":"🔢 Estimate Nutrition"}
          </button>
        )}
        {journalNutrition&&(
          <div style={{background:C.surface,borderRadius:10,padding:12,marginBottom:16,border:"1px solid #444"}}>
            <div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:8,letterSpacing:0.8}}>ESTIMATED NUTRITION</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[["Protein",journalNutrition.protein_g,"g","#3b82f6"],
                ["Calories",journalNutrition.calories,"cal","#f59e0b"],
                ["Carbs",journalNutrition.carbs_g,"g","#22c55e"],
                ["Sat. Fat",journalNutrition.sat_fat_g,"g","#dc2626"],
                ["Sugar",journalNutrition.sugar_g,"g","#f97316"],
                ["Fiber",journalNutrition.fiber_g,"g","#8b5cf6"]
              ].map(([label,val,unit,color])=>(
                <div key={label} style={{background:C.card,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontFamily:FM,fontSize:9,color:"#666",marginBottom:2}}>{label}</div>
                  <div style={{fontFamily:FD,fontSize:seniorMode?18:14,color:color}}>{val??"-"}<span style={{fontSize:9,color:"#555"}}> {unit}</span></div>
                </div>
              ))}
            </div>
            {activeMember?.bariatricPhase&&journalWeight&&(()=>{
              const oz=journalWeightUnit==="oz"?parseFloat(journalWeight):toGrams(journalWeight,journalWeightUnit)/28.3495;
              const limit=activeMember.bariatricPhase==="Liquid"?2:activeMember.bariatricPhase==="Pureed"?4:activeMember.bariatricPhase==="Soft"?6:8;
              return oz>limit
                ?<div style={{background:"#dc262618",border:"1px solid #dc262644",borderRadius:6,padding:"6px 10px",marginTop:8,fontFamily:FM,fontSize:11,color:"#dc2626"}}>
                  ⚠ {oz.toFixed(1)} oz exceeds your {activeMember.bariatricPhase} phase limit of {limit} oz per sitting
                </div>
                :<div style={{background:"#22c55e18",border:"1px solid #22c55e44",borderRadius:6,padding:"6px 10px",marginTop:8,fontFamily:FM,fontSize:11,color:"#22c55e"}}>
                  ✓ {oz.toFixed(1)} oz is within your {activeMember.bariatricPhase} phase limit
                </div>;
            })()}
            {journalNutrition.notes&&<div style={{fontFamily:FM,fontSize:10,color:"#666",marginTop:6,fontStyle:"italic"}}>{journalNutrition.notes}</div>}
          </div>
        )}
        {journalSuccess&&(
          <div style={{background:"#10b98122",border:"1px solid #10b98144",borderRadius:10,padding:"12px 16px",marginBottom:12,textAlign:"center",fontFamily:FM,fontSize:seniorMode?16:13,color:"#10b981",fontWeight:700}}>
            ✅ Logged! Dashboard updated.
          </div>
        )}
        <button onClick={saveEntry} disabled={!journalFoodName.trim()||journalSaving}
          style={{width:"100%",background:journalFoodName.trim()?"#10b981":"#333",border:"none",borderRadius:10,
          padding:seniorMode?"16px":"12px",color:journalFoodName.trim()?"#fff":"#666",
          fontFamily:FM,fontSize:seniorMode?20:15,fontWeight:700,cursor:journalFoodName.trim()?"pointer":"default",
          marginBottom:8,opacity:journalSaving?0.6:1}}>
          {journalSaving?"⏳ Saving...":"📗 Log This Entry"}
        </button>
        <div style={{fontFamily:FM,fontSize:10,color:"#555",textAlign:"center",marginTop:4}}>For guidance only. Consult your healthcare provider for specific dietary recommendations.</div>
      </div>
    </div>
  );
}

export default function SmartKitchen({ tier="free", can={}, onUpgrade=()=>{}, user=null, viewerRole=null, onShowGuestViewer=null }){
  // -- State ------------------------------------------------------------------
  const isViewer = !!viewerRole; // true = read-only viewer of another account
  const [isManager,setIsManager]=useState(false);
  const [managerOwnerUid,setManagerOwnerUid]=useState(null);
  const [voiceState,setVoiceState]=useState("idle");
  const [voiceTranscript,setVoiceTranscript]=useState("");
  const [voiceResponse,setVoiceResponse]=useState("");
  const [showVoicePanel,setShowVoicePanel]=useState(false);
  const [lastSuggestedMeal,setLastSuggestedMeal]=useState(null);
  const assistantName=()=>{try{return localStorage.getItem("sk_assistantName")||"Cathy";}catch{return "Cathy";}};
  const voiceRecRef=React.useRef(null);
  const [showInviteManager,setShowInviteManager]=useState(false);
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteRole,setInviteRole]=useState("viewer");
  const [inviteSending,setInviteSending]=useState(false);
  const [inviteSuccess,setInviteSuccess]=useState("");
  const [acceptCode,setAcceptCode]=useState("");
  const [acceptSending,setAcceptSending]=useState(false);
  const [showJoinViewer,setShowJoinViewer]=useState(false);
  const [tab,setTab]=useState(()=>{try{const saved=localStorage.getItem("sk_activeTab");return saved||"mealplan";}catch{return "mealplan";}});
  const [leftoversOpen,setLeftoversOpen]=useState(false);
  const [leftoversPreview,setLeftoversPreview]=useState(null);
  const [leftoversB64,setLeftoversB64]=useState(null);
  const [leftoversUnknown,setLeftoversUnknown]=useState(false);
  const [leftoversManualName,setLeftoversManualName]=useState("");
  const [leftoversMime,setLeftoversMime]=useState("image/jpeg");
  const [leftoversResult,setLeftoversResult]=useState(null);
  const [leftoversLoading,setLeftoversLoading]=useState(false);
  const [leftoversError,setLeftoversError]=useState("");
  const [subQuery,setSubQuery]=useState("");
  const [subResult,setSubResult]=useState(null);
  const [subLoading,setSubLoading]=useState(false);
  const [subError,setSubError]=useState("");
  const [inventory,setInventory]=useState(()=>loadLocal("sk_inventory",INITIAL_INVENTORY));
  const [recipes,setRecipes]=useState(()=>loadLocal("sk_recipes",[]));const [swapRecipeModal,setSwapRecipeModal]=useState(null);const [swapRecipeRequest,setSwapRecipeRequest]=useState("");const [swapRecipeLoading,setSwapRecipeLoading]=useState(false);const [addToPlanRecipe,setAddToPlanRecipe]=useState(null);const [addToPlanDay,setAddToPlanDay]=useState("");const [addToPlanConfirm,setAddToPlanConfirm]=useState(null);const [exploreOpen,setExploreOpen]=useState(false);const [exploreQuery,setExploreQuery]=useState("");const [exploreMode,setExploreMode]=useState("");const [exploreLoading,setExploreLoading]=useState(false);const [exploreResults,setExploreResults]=useState(null);
  const [recipeRatings,setRecipeRatings]=useState(()=>loadLocal("sk_recipeRatings",{}));
  const [mealPhotos,setMealPhotos]=useState(()=>loadLocal("sk_mealPhotos",{}));
  const [photoPromptMeal,setPhotoPromptMeal]=useState(null);
  const [photoSkipCount,setPhotoSkipCount]=useState(()=>{try{return parseInt(localStorage.getItem("sk_photoSkipCount")||"0");}catch{return 0;}});
  const [savedRecipesFilter,setSavedRecipesFilter]=useState("all");
  const [recipeError,setRecipeError]=useState("");
  const [mealPlan,setMealPlan]=useState(()=>loadLocal("sk_mealPlan",[]));
  const [sportsNights,setSportsNights]=useState(()=>loadLocal('sk_sportsNights',[]));
  const [shopping,setShopping]=useState([]);
  const [restockQueue,setRestockQueue]=useState(()=>{try{return JSON.parse(localStorage.getItem("sk_restockQueue")||"[]")}catch{return []}});
  const [shopPartnerName,setShopPartnerName]=useState(()=>localStorage.getItem("sk_shopPartnerName")||"");
  const [shopPartnerEmail,setShopPartnerEmail]=useState(()=>localStorage.getItem("sk_shopPartnerEmail")||"");
  const [shopPhone,setShopPhone]=useState(()=>localStorage.getItem("sk_shopPhone")||"");
  const [instacartApiKey,setInstacartApiKey]=useState(()=>localStorage.getItem("sk_instacartKey")||"");
  const [expandedIngDay,setExpandedIngDay]=useState(null);
  const [shareSelected,setShareSelected]=useState({});// {recipeKey: recipeObj}
  const [shareMode,setShareMode]=useState(false);
  const [showShareModal,setShowShareModal]=useState(false);
  const [shareTitle,setShareTitle]=useState("");
  const [shareResult,setShareResult]=useState(null);
  const [shareLoading,setShareLoading]=useState(false);
  const [showImportModal,setShowImportModal]=useState(false);
  const [importCode,setImportCode]=useState("");
  const [importResult,setImportResult]=useState(null);
  const [importLoading,setImportLoading]=useState(false);
  const [shareCopied,setShareCopied]=useState(false);
  const [instacartStore,setInstacartStore]=useState(()=>localStorage.getItem("sk_instacartStore")||"meijer");
  const [deliveryService,setDeliveryService]=useState(()=>localStorage.getItem("sk_deliveryService")||"instacart");
  const [instacartLoading,setInstacartLoading]=useState(false);
  const [smsSent,setSmsSent]=useState(false);
  const [showSmsHelp,setShowSmsHelp]=useState(false);
  const [desserts,setDesserts]=useState(()=>loadLocal("sk_desserts",[]));
  const [dessertRatings,setDessertRatings]=useState(()=>loadLocal("sk_dessertRatings",{}));
  const [activeDessert,setActiveDessert]=useState(null);
  const [dessertLoading,setDessertLoading]=useState(false);
  const [dessertError,setDessertError]=useState("");
  const [loading,setLoading]=useState(false);
  const [loadMsg,setLoadMsg]=useState("");
  const [filterCat,setFilterCat]=useState("All");const [invSearch,setInvSearch]=useState("");const [invSort,setInvSort]=useState("category");
  const [filterLoc,setFilterLoc]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const [showRejected,setShowRejected]=useState(()=>{try{const v=localStorage.getItem("sk_showRejected");return v===null?true:v==="true";}catch{return true;}});
  const [newItem,setNewItem]=useState({name:"",qty:"",unit:"",category:"Pantry",location:"Pantry",harvestType:""});
  const [activeRecipe,setActiveRecipe]=useState(null);
  const [familySize,setFamilySize]=useState(()=>loadLocal("sk_familySize",3));
  const [familyProfiles,setFamilyProfiles]=useState(()=>loadLocal("sk_familyProfiles",DEFAULT_PROFILES));
  const [tempProfiles,setTempProfiles]=useState(()=>loadLocal("sk_tempProfiles",[]));
  const [seniorMode,setSeniorMode]=useState(()=>{try{return localStorage.getItem("sk_seniorMode")==="1";}catch{return false;}});
  const [seniorPromptDismissed,setSeniorPromptDismissed]=useState(()=>{try{return localStorage.getItem("sk_seniorPromptDismissed")==="1";}catch{return false;}});
  const [showSeniorPrompt,setShowSeniorPrompt]=useState(false);
  const [darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem("sk_darkMode")!=="0";}catch{return true;}});
  // Apply theme by toggling body class — CSS variables handle the rest
  useEffect(()=>{
    document.body.classList.toggle("sk-light",!darkMode);
    document.body.classList.toggle("sk-dark",darkMode);
    try{localStorage.setItem("sk_darkMode",darkMode?"1":"0");}catch{}
  },[darkMode]);
  const [showTempForm,setShowTempForm]=useState(false);
  const [newTemp,setNewTemp]=useState({name:"",reason:"",restriction:"lowSodium",customNotes:"",startDate:new Date().toISOString().split("T")[0],endDate:"",duration:7});
  const [profileModalOpen,setProfileModalOpen]=useState(false);
  const [recipeSite,setRecipeSite]=useState(()=>loadLocal("sk_recipeSite","google"));
  const [showSettings,setShowSettings]=useState(false);
  const [showWizard,setShowWizard]=useState(()=>{try{const urlHasSignup=window.location.hash.includes("type=signup")||window.location.hash.includes("type=recovery")||sessionStorage.getItem("sk_newSignup")==="1";if(urlHasSignup){sessionStorage.setItem("sk_newSignup","1");return true;}return localStorage.getItem("sk_setupDone")!=="1"&&loadLocal("sk_inventory",[]).length===0;}catch{return false;}});
  const [wizardStep,setWizardStep]=useState(-3);
  const [kitchenAppliances,setKitchenAppliances]=useState(()=>{try{return JSON.parse(localStorage.getItem("sk_appliances")||"[]");}catch{return [];}});
  const [applianceCustomInput,setApplianceCustomInput]=useState("");
  const [showMadeItModal,setShowMadeItModal]=useState(false);
  const [madeItDay,setMadeItDay]=useState(null);
  const [madeItSides,setMadeItSides]=useState([]);
  const [madeItSideInput,setMadeItSideInput]=useState("");
  const [madeItSubs,setMadeItSubs]=useState({});
  const [wizardSignupName,setWizardSignupName]=useState("");
  const [wizardSignupEmail,setWizardSignupEmail]=useState("");
  const [wizardSignupPassword,setWizardSignupPassword]=useState("");
  const [wizardSignupError,setWizardSignupError]=useState("");
  const [wizardSignupLoading,setWizardSignupLoading]=useState(false);
  const [wizardProteins,setWizardProteins]=useState([]);
  const [wizardProteinInput,setWizardProteinInput]=useState({name:"",qty:"",oz:"6"});
  const [pantryChecklist,setPantryChecklist]=useState(()=>COMMON_PANTRY.map(i=>({...i,checked:false})));
  const [showInstallBanner,setShowInstallBanner]=useState(()=>{try{return localStorage.getItem("sk_installDismissed")!=="1";}catch{return true;}});
  // -- Support Chat State -------------------------------------------------------
  const [chatOpen,setChatOpen]=useState(false);
  const [chatBubblePos,setChatBubblePos]=useState(()=>{try{const s=localStorage.getItem("sk_chatBubblePos");return s?JSON.parse(s):{x:null,y:null};}catch{return {x:null,y:null};}});
  const chatDragRef=React.useRef({dragging:false,startX:0,startY:0,startPosX:0,startPosY:0});
  const [chatMessages,setChatMessages]=useState([]);
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const [chatWelcomeDone,setChatWelcomeDone]=useState(()=>{try{return localStorage.getItem("sk_chatWelcomeDone")==="1";}catch{return false;}});
  const [tourChoice,setTourChoice]=useState(()=>{try{return localStorage.getItem("sk_tourChoice")||null;}catch{return null;}});
  const [tourStep,setTourStep]=useState(()=>{try{return parseInt(localStorage.getItem("sk_tourStep")||"0");}catch{return 0;}});
  const [proactiveQuickReplies,setProactiveQuickReplies]=useState([]);
  const [showOccasionPlanner,setShowOccasionPlanner]=useState(false);
  const [occasionState,setOccasionState]=useState({eventType:"",audienceType:"family",headCount:"",mode:"use",budget:"",guestRestrictions:"",note:""});
  const [occasionStep,setOccasionStep]=useState("form");// form | loading | result | date
  const [occasionCustomText,setOccasionCustomText]=useState("");
  const [occasionResult,setOccasionResult]=useState(null);
  const [occasionDate,setOccasionDate]=useState("");
  const [occasionLoading,setOccasionLoading]=useState(false);
  const chatEndRef=useRef(null);
  // -- Guest Email Capture State ------------------------------------------------
  const [showGuestCapture,setShowGuestCapture]=useState(false);
  const [guestEmail,setGuestEmail]=useState("");
  const [showEmailGate,setShowEmailGate]=useState(false);
  const [trialEmail,setTrialEmail]=useState("");
  const [trialEmailError,setTrialEmailError]=useState("");
  const [trialEmailSubmitting,setTrialEmailSubmitting]=useState(false);
  const [magicLinkSent,setMagicLinkSent]=useState(false);
  const [trialPassword,setTrialPassword]=useState("");
  const [showTrialPassword,setShowTrialPassword]=useState(false);
  const [trialConfirmSent,setTrialConfirmSent]=useState(false);
  const [guestCaptured,setGuestCaptured]=useState(()=>{try{return localStorage.getItem("sk_guestCaptured")==="1";}catch{return false;}});
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
  const [emailSentModal,setEmailSentModal]=useState(null);
  const [upgradeModal,setUpgradeModal]=useState(null);
  const [labelModal,setLabelModal]=useState(false);const [labelSelected,setLabelSelected]=useState({});const [labelFormat,setLabelFormat]=useState("5163");const [labelQty,setLabelQty]=useState({});
  const [batchPrintCue,setBatchPrintCue]=useState(null);
  const [leftoverSavedCue,setLeftoverSavedCue]=useState(null);
  const [makeThisModal,setMakeThisModal]=useState(false);
  const [makeThisInput,setMakeThisInput]=useState("");
  const [makeThisResult,setMakeThisResult]=useState(null);
  const [makeThisLoading,setMakeThisLoading]=useState(false);
  const [familyRecipesOpen,setFamilyRecipesOpen]=useState(false);
  const [familyRecipes,setFamilyRecipes]=useState(()=>{try{const s=localStorage.getItem("sk_familyRecipes");return s?JSON.parse(s):[];}catch{return [];}});
  const [frAddMode,setFrAddMode]=useState(null);
  const [frEditRecipe,setFrEditRecipe]=useState(null);
  const [frViewRecipe,setFrViewRecipe]=useState(null);
  const [frLoading,setFrLoading]=useState(false);
  const [frPhotoPreview,setFrPhotoPreview]=useState(null);
  const [frPhotoB64,setFrPhotoB64]=useState(null);
  const [frPhotos,setFrPhotos]=useState([]);
  const [frIdeaInput,setFrIdeaInput]=useState("");
  const [frServings,setFrServings]=useState(4);
  const [frDraft,setFrDraft]=useState({name:"",kitchenOf:"",notes:"",servings:4,ingredients:[],steps:[],rotation:false,frequency:"4week",seasons:[],photo:null});
  const [canIHaveOpen,setCanIHaveOpen]=useState(false);
  const [showScaleModal,setShowScaleModal]=useState(false);
  const [scaleDevice,setScaleDevice]=useState(null);
  // -- Food Journal state ------------------------------------------------
  const [showJournal,setShowJournal]=useState(false);
  const [dashRefreshKey,setDashRefreshKey]=useState(0);
  const [journalMember,setJournalMember]=useState(null);
  const [journalMealType,setJournalMealType]=useState("Meal");
  const [journalFoodName,setJournalFoodName]=useState("");
  const [journalWeight,setJournalWeight]=useState("");
  const [journalWeightUnit,setJournalWeightUnit]=useState("oz");
  const [journalDateTime,setJournalDateTime]=useState("");
  const [journalNutrition,setJournalNutrition]=useState(null);
  const [journalCalcLoading,setJournalCalcLoading]=useState(false);
  const [journalSaving,setJournalSaving]=useState(false);
  const [journalSuccess,setJournalSuccess]=useState(false);
  const [journalRecentItems,setJournalRecentItems]=useState([]);

  const [plateSession,setPlateSession]=useState(null);// {active,memberName,mealName,mealDay,components:[],cumulativeG,step,sessionId}
  const [plateSuggestedComponents,setPlateSuggestedComponents]=useState([]);// [{name,category,suggestedOz,editable}]
  const [plateCurrentComponentIdx,setPlateCurrentComponentIdx]=useState(-1);
  const [plateComponentsLoading,setPlateComponentsLoading]=useState(false);
  const [platePendingMeal,setPlatePendingMeal]=useState(null);// stored day object while member picker is shown
  const [plateQualifyingMembers,setPlateQualifyingMembers]=useState([]);
  const [plateStep,setPlateStep]=useState(0);
  const [plateComponents,setPlateComponents]=useState([]);
  const [plateCumulativeG,setPlateCumulativeG]=useState(0);
  const [plateSessionId,setPlateSessionId]=useState(null);
  const [plateCoachNote,setPlateCoachNote]=useState("");
  const [plateCoachLoading,setPlateCoachLoading]=useState(false);
  const [showPlateSummary,setShowPlateSummary]=useState(false);
  const [scaleWeight,setScaleWeight]=useState(null);
  const [scaleUnit,setScaleUnit]=useState("g");
  const [scaleWeightGrams,setScaleWeightGrams]=useState(0);
  const [scaleRawBytes,setScaleRawBytes]=useState("");
  const [scaleConnecting,setScaleConnecting]=useState(false);
  const [scaleFoodName,setScaleFoodName]=useState("");
  const [scaleCalcResult,setScaleCalcResult]=useState(null);
  const [scaleCalcLoading,setScaleCalcLoading]=useState(false);
  const [scaleError,setScaleError]=useState("");
  const [canIHaveText,setCanIHaveText]=useState("");
  const [canIHaveImg,setCanIHaveImg]=useState(null);
  const [canIHaveLoading,setCanIHaveLoading]=useState(false);
  const [canIHaveResult,setCanIHaveResult]=useState(null);
  const [scanOpen,setScanOpen]=useState(false);
  const [scanLoc,setScanLoc]=useState("");
  const [scanShelf,setScanShelf]=useState("");
  const [scanPreview,setScanPreview]=useState(null);
  const [scanB64,setScanB64]=useState(null);
  const [scanMime,setScanMime]=useState("image/jpeg");
  const [scanResults,setScanResults]=useState(null);const [changeMealModal,setChangeMealModal]=useState(null);const [pairDrinkMeal,setPairDrinkMeal]=useState(null);const [pairDrinkResult,setPairDrinkResult]=useState(null);const [pairDrinkLoading,setPairDrinkLoading]=useState(false);const [pairDrinkCellar,setPairDrinkCellar]=useState(null);const [pairDrinkCellarLoading,setPairDrinkCellarLoading]=useState(false);const [pairDrinkMarkedBottle,setPairDrinkMarkedBottle]=useState(null);const [pairDrinkMarkStatus,setPairDrinkMarkStatus]=useState(null);const [cellarPullStatus,setCellarPullStatus]=useState(null);const [expandedDay,setExpandedDay]=useState(null);const [changeMealRequest,setChangeMealRequest]=useState("");const [changeMealLoading,setChangeMealLoading]=useState(false);
  const [scanStage,setScanStage]=useState("upload");
  const [scanMode,setScanMode]=useState("shelf");
  const [saleItems,setSaleItems]=useState(()=>{try{return JSON.parse(localStorage.getItem("sk_saleItems")||"[]");}catch{return [];}});
  const [rpOpen,setRpOpen]=useState(false);
  const [rpYieldConfirm,setRpYieldConfirm]=useState(null);
  const [rpActualBags,setRpActualBags]=useState("");
  const [rpMode,setRpMode]=useState("protein");
  const [rpPName,setRpPName]=useState("");
  const [rpPLbs,setRpPLbs]=useState("");
  const [rpPOz,setRpPOz]=useState(6);
  const [rpPPreview,setRpPPreview]=useState(null);
  const [rpVSessions,setRpVSessions]=useState([{id:1,preset:{name:"Mixed Sauté Blend",cupsPerUnit:3,bagCups:2,color:C.orange},count:"",bags:null}]);
  const [rpHCat,setRpHCat]=useState("Wild Harvest");
  const [rpHItem,setRpHItem]=useState("");
  const [rpHRaw,setRpHRaw]=useState("");
  const [rpHOz,setRpHOz]=useState(16);
  const [rpHForm,setRpHForm]=useState("Canned");
  const [rpHMeasure,setRpHMeasure]=useState("lbs");
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
  useEffect(()=>{
    try{localStorage.setItem("sk_inventory",JSON.stringify(inventory));}catch{}
    if(user&&inventory.length>0){
      clearTimeout(window._invSaveTimer);
      window._invSaveTimer=setTimeout(()=>{
        import("./supabaseClient").then(m=>m.saveCloudData(user.id)).catch(()=>{});
      },10000);
    }
  },[inventory]);
  useEffect(()=>{
    try{localStorage.setItem("sk_mealPlan",JSON.stringify(mealPlan));}catch{}
    if(user&&mealPlan.length>0){
      clearTimeout(window._mpSaveTimer);
      window._mpSaveTimer=setTimeout(()=>{
        import("./supabaseClient").then(m=>m.saveCloudData(user.id)).catch(()=>{});
      },10000);
    }
  },[mealPlan]);
  useEffect(()=>{try{localStorage.setItem("sk_saleItems",JSON.stringify(saleItems));}catch{}},[saleItems]);
  useEffect(()=>{try{localStorage.setItem("sk_familySize",JSON.stringify(familySize));}catch{}},[familySize]);
  useEffect(()=>{try{localStorage.setItem("sk_familyProfiles",JSON.stringify(familyProfiles));}catch{}},[familyProfiles]);
  useEffect(()=>{try{localStorage.setItem("sk_appliances",JSON.stringify(kitchenAppliances));}catch{}},[kitchenAppliances]);
  useEffect(()=>{try{localStorage.setItem("sk_tempProfiles",JSON.stringify(tempProfiles));}catch{}},[tempProfiles]);
  useEffect(()=>{try{localStorage.setItem("sk_seniorMode",seniorMode?"1":"0");}catch{}},[seniorMode]);
  // Suppress wizard when signed in OR in viewer mode
  useEffect(()=>{
    if(user||isViewer){
      setShowWizard(false);
      setWizardStep(null);
    }
  },[user,isViewer]);
  // Reload state from localStorage when cloud data arrives
  useEffect(()=>{
    const handler=()=>{
      try{
        const inv=localStorage.getItem("sk_inventory");if(inv){const parsed=JSON.parse(inv);setInventory(parsed);}
        const fp=localStorage.getItem("sk_familyProfiles");if(fp)setFamilyProfiles(JSON.parse(fp));
        const fs=localStorage.getItem("sk_familySize");if(fs)setFamilySize(parseInt(fs)||2);
        const mp=localStorage.getItem("sk_mealPlan");if(mp)setMealPlan(JSON.parse(mp));
        const fr=localStorage.getItem("sk_familyRecipes");if(fr)setFamilyRecipes(JSON.parse(fr));
        const rr=localStorage.getItem("sk_recipeRatings");if(rr)setRecipeRatings(JSON.parse(rr));
        const dr=localStorage.getItem("sk_dessertRatings");if(dr)setDessertRatings(JSON.parse(dr));
        const rs=localStorage.getItem("sk_recipeSite");if(rs)setRecipeSite(rs);
        const sm=localStorage.getItem("sk_seniorMode");if(sm)setSeniorMode(sm==="1"||sm==="true");
        const dm=localStorage.getItem("sk_darkMode");if(dm)setDarkMode(dm==="1"||dm==="true");
        const sp=localStorage.getItem("sk_shopPartnerName");if(sp)setShopPartnerName(sp);
        const se=localStorage.getItem("sk_shopPartnerEmail");if(se)setShopPartnerEmail(se);
        // If setup was done on another device, suppress wizard
        // BUT: never suppress if this is a fresh email confirmation (type=signup in URL)
        const sd=localStorage.getItem("sk_setupDone");
        const isNewSignup=sessionStorage.getItem("sk_newSignup")==="1";
        const urlIsConfirmation=window.location.hash.includes("type=signup")||window.location.search.includes("type=signup");
        if((sd==="1"||sd==="true")&&!isNewSignup&&!urlIsConfirmation){
          setShowWizard(false);
          setWizardStep(null);
        }
      }catch(e){}
    };
    window.addEventListener("sk_cloud_loaded",handler);
    return ()=>window.removeEventListener("sk_cloud_loaded",handler);
  },[]);

  useEffect(()=>{
    try{
      // Save WITH photos first — fall back to without only if quota exceeded
      localStorage.setItem("sk_familyRecipes",JSON.stringify(familyRecipes));
    }catch(e){
      // Quota exceeded — try saving without photos to preserve recipe data
      try{
        const slim=familyRecipes.map(r=>({...r,photo:null}));
        localStorage.setItem("sk_familyRecipes",JSON.stringify(slim));
      }catch{}
    }
    // Cloud sync — debounced 10s to prevent loop on rapid state changes
    if(user?.id){
      clearTimeout(window._frSaveTimer);
      window._frSaveTimer=setTimeout(()=>{
        const cloudCopy=familyRecipes.map(r=>{const{photo,...rest}=r;return rest;});
        import("./supabaseClient").then(m=>m.saveCloudField(user.id,"family_recipes",cloudCopy)).catch(()=>{});
      },10000);
    }
  },[familyRecipes,user]);
  useEffect(()=>{
    const person1=familyProfiles[0];
    if(person1?.restriction==="senior"&&!seniorMode&&!seniorPromptDismissed){
      const timer=setTimeout(()=>setShowSeniorPrompt(true),800);
      return ()=>clearTimeout(timer);
    } else {
      setShowSeniorPrompt(false);
    }
  },[familyProfiles,seniorMode,seniorPromptDismissed]);
  useEffect(()=>{try{localStorage.setItem("sk_recipes",JSON.stringify(recipes));}catch{}},[recipes]);
  useEffect(()=>{try{localStorage.setItem("sk_desserts",JSON.stringify(desserts));}catch{}},[desserts]);
  useEffect(()=>{try{localStorage.setItem("sk_dessertRatings",JSON.stringify(dessertRatings));}catch{}},[dessertRatings]);
  useEffect(()=>{try{localStorage.setItem("sk_recipeRatings",JSON.stringify(recipeRatings));}catch{}},[recipeRatings]);
  useEffect(()=>{
    try{
      localStorage.setItem("sk_mealPhotos",JSON.stringify(mealPhotos));
    }catch(e){
      // If quota exceeded, remove oldest photo and retry
      try{
        const keys=Object.keys(mealPhotos);
        if(keys.length>1){
          const trimmed={...mealPhotos};
          delete trimmed[keys[0]];
          localStorage.setItem("sk_mealPhotos",JSON.stringify(trimmed));
        }
      }catch{}
    }
  },[mealPhotos]);
  useEffect(()=>{try{localStorage.setItem("sk_sportsNights",JSON.stringify(sportsNights));}catch{}},[sportsNights]);
  useEffect(()=>{try{localStorage.setItem("sk_activeTab",tab);}catch{}},[tab]);
  useEffect(()=>{
    if(showWizard){
      const t=setTimeout(()=>{
        setChatOpen(true);
        const alreadyDone=chatWelcomeDone;
        if(!alreadyDone){
          setChatWelcomeDone(true);
          try{localStorage.setItem("sk_chatWelcomeDone","1");}catch{}
        }
        const greeting=`Hi ${userName}! 👋 Welcome to Smart Kitchen — I'm so glad you're here.\n\nI'm your kitchen assistant. I can help you get set up, answer questions, and I genuinely want to hear what you think — good, bad, or anything in between.\n\nWould you like a quick guided tour to get started? I'll walk you through everything one step at a time, and you're in control the whole way. Just say **yes** or **no** — no pressure either way! 😊`;
        setTimeout(()=>addChatMsg("assistant",greeting),400);
      },1000);
      return ()=>clearTimeout(t);
    }
  },[showWizard]);
  // Guest email capture — show after 3 min if not signed in and not already captured
  useEffect(()=>{
    if(user||guestCaptured) return;
    const t=setTimeout(()=>setShowGuestCapture(true), 3*60*1000);
    return ()=>clearTimeout(t);
  },[user,guestCaptured]);

  // -- Proactive Feature Announcements -----------------------------------------
  useEffect(()=>{
    if(showWizard) return;
    const t=setTimeout(()=>{
      const unseen=FEATURE_ANNOUNCEMENTS.find(f=>{
        try{return localStorage.getItem("sk_seenFeature_"+f.key)!=="1";}catch{return false;}
      });
      if(!unseen) return;
      try{localStorage.setItem("sk_seenFeature_"+unseen.key,"1");}catch{}
      setChatOpen(true);
      const msg=unseen.intro(userName);
      setTimeout(()=>{
        addChatMsg("assistant",msg);
        setProactiveQuickReplies(unseen.quickReplies||[]);
      },600);
    },3000);
    return ()=>clearTimeout(t);
  },[showWizard]);

  const submitGuestEmail=async()=>{
    if(!guestEmail||!guestEmail.includes("@")) return;
    try{
      await fetch("/api/mailchimp-subscribe",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:guestEmail,name:"",tag:"guest"}),
      });
    }catch(e){console.warn("Guest capture failed:",e);}
    setShowGuestCapture(false);
    setGuestCaptured(true);
    try{localStorage.setItem("sk_guestCaptured","1");}catch{}
  };

  // -- Computed values --------------------------------------------------------
  const blendItem=inventory.find(i=>i.vegType==="sauteBlend")||inventory.find(i=>i.name.toLowerCase().includes("saute")&&i.category==="Frozen");
  const proteinItems=inventory.filter(i=>i.isBulkProtein||(i.harvestType==="Protein"&&(i.category==="Wild Harvest"||i.category==="Home Harvest")));
  const totalPortions=proteinItems.reduce((a,i)=>a+(parseFloat(i.qty)||0),0);
  const condimentItems=inventory.filter(i=>i.isCondiment);
  const activeProfiles=familyProfiles.filter(p=>p.active);
  const restrictedProfiles=activeProfiles.filter(p=>p.restriction!=="none"&&p.restriction!=="standard");
  const activeFlags=activeProfiles.flatMap(p=>RESTRICTION_PRESETS[p.restriction]?.flags||[]);
  const today=new Date().toISOString().split("T")[0];
  const activeTempProfiles=tempProfiles.filter(t=>t.startDate<=today&&(!t.endDate||t.endDate>=today));
  const tempFlags=activeTempProfiles.flatMap(t=>RESTRICTION_PRESETS[t.restriction]?.flags||[]);
  const allActiveFlags=[...new Set([...activeFlags,...tempFlags])];
  const hasNoWhiteRice=activeFlags.includes("no-white-rice");
  const hasNoRegularPasta=activeFlags.includes("no-regular-pasta");
  const hasZeroSugar=activeFlags.includes("zero-sugar");

  // Medical+ warn/strict enforcement helper
  const getMedicalWarnings=(mealName)=>{
    if(!can.medicalCompliance||!mealName) return [];
    const meal=mealName.toLowerCase();
    const warnings=[];
    const INTERACTIONS=[
      {drugs:["warfarin","coumadin"],foods:["spinach","kale","broccoli","brussels sprouts","collard","chard","parsley","cilantro","green onion","lettuce"],msg:"High vitamin K — may affect Warfarin"},
      {drugs:["warfarin","coumadin"],foods:["grapefruit","grapefruit juice"],msg:"Grapefruit — may affect Warfarin"},
      {drugs:["rosuvastatin","atorvastatin","lovastatin","simvastatin","pravastatin"],foods:["grapefruit","grapefruit juice"],msg:"Grapefruit — interacts with statins"},
      {drugs:["lisinopril","enalapril","ramipril","benazepril","losartan","valsartan"],foods:["banana","orange juice","potato","tomato","avocado","cantaloupe","sweet potato"],msg:"High potassium — monitor with ACE inhibitor"},
      {drugs:["metformin"],foods:["alcohol","beer","wine","spirits"],msg:"Alcohol — use caution with Metformin"},
      {drugs:["fluoxetine","sertraline","paroxetine","amitriptyline","trazodone","mirtazapine"],foods:["aged cheese","salami","pepperoni","sausage","soy sauce","kimchi","sauerkraut","wine","beer"],msg:"Tyramine-rich food — caution with antidepressant"},
      {drugs:["levothyroxine"],foods:["soy","tofu","tempeh","edamame","cabbage","cauliflower","broccoli","kale","brussels sprouts"],msg:"May reduce Levothyroxine absorption"},
      {drugs:["oxycodone","hydrocodone","morphine","tramadol","codeine"],foods:["grapefruit","grapefruit juice"],msg:"Grapefruit — may intensify opioid effect"},
      {drugs:["spironolactone","lisinopril","losartan"],foods:["banana","avocado","potato","tomato","orange juice","sweet potato"],msg:"High potassium — caution with potassium-sparing med"},
      {drugs:["prednisone","fludrocortisone"],foods:["salt","sodium","soy sauce","canned soup","processed"],msg:"High sodium — caution with corticosteroid"},
    ];
    activeProfiles.filter(p=>p.enforcement&&p.enforcement!=="inform"&&p.enforcement!=="none"&&((p.medications||[]).length>0)).forEach(p=>{
      const memberMeds=(p.medications||[]).map(m=>(m.name||"").toLowerCase());
      INTERACTIONS.forEach(({drugs,foods,msg})=>{
        const hasDrug=drugs.some(d=>memberMeds.some(m=>m.includes(d)));
        const hasFood=foods.some(f=>meal.includes(f));
        if(hasDrug&&hasFood){
          warnings.push({member:p.name||"Family member",msg,enforcement:p.enforcement||"warn"});
        }
      });
    });
    return warnings;
  };

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
        if(f.includes("soft-textures")) parts.push("soft easy-to-chew textures preferred");
        if(f.includes("simple-prep")) parts.push("simple preparation — minimal steps");
        if(f.includes("familiar-foods")) parts.push("familiar comfort foods — avoid exotic ingredients");
        if(f.includes("small-portions")) parts.push("smaller senior-appropriate portions");
        if(f.includes("high-protein")) parts.push("HIGH PROTEIN for athlete performance");
        if(f.includes("high-calorie")) parts.push("HIGH CALORIE for athlete energy needs");
        const c=p.customParams||{};
        if(c.carbsPerMeal) parts.push("max "+c.carbsPerMeal+"g carbs/meal");
        if(c.sodiumMg) parts.push("max "+c.sodiumMg+"mg sodium/day");
        if(c.potassiumMg) parts.push("max "+c.potassiumMg+"mg potassium/day");
        if(c.proteinG) parts.push("max "+c.proteinG+"g protein/day");
        return (p.name||r?.label||"Person")+": "+parts.join(", ");
      }).join("; ")+". ";
    }
    // Age-aware context
    const today=new Date();
    const profilesWithDob=activeProfiles.filter(p=>p.dob);
    if(profilesWithDob.length>0){
      const ageNotes=profilesWithDob.map(p=>{
        const age=Math.floor((today-new Date(p.dob+"T12:00:00"))/(1000*60*60*24*365.25));
        const bday=new Date(p.dob+"T12:00:00");
        const nextBday=new Date(today.getFullYear(),bday.getMonth(),bday.getDate());
        if(nextBday<today) nextBday.setFullYear(today.getFullYear()+1);
        const daysUntil=Math.ceil((nextBday-today)/(1000*60*60*24));
        let note=(p.name||"Person")+" is "+age+" years old";
        if(age<3) note+=" (toddler — soft foods, no choking hazards, very small portions)";
        else if(age<12) note+=" (child — kid-friendly portions and flavors)";
        else if(age<18) note+=" (teen)";
        else if(age>=70) note+=" (senior — soft easy-to-chew options appreciated)";
        if(daysUntil<=7) note+=" — BIRTHDAY IN "+daysUntil+" DAYS: suggest a special birthday dinner or dessert this week!";
        return note;
      });
      s+="AGES: "+ageNotes.join("; ")+". ";
    }
    const athletes=activeProfiles.filter(p=>p.restriction==="athlete");
    if(athletes.length>0) s+=athletes.length+" teen athlete(s) need larger portions. ";
    // Medical+ profiles injection
    if(can.medicalCompliance){
      const medProfiles=activeProfiles.filter(p=>p.medicalPlan||((p.medicalAllergies||[]).length>0)||p.medicalAllergiesCustom||((p.medications||[]).length>0)||((p.supplements||[]).length>0));
      if(medProfiles.length>0){
        s+="MEDICAL+ PROFILES: "+medProfiles.map(p=>{
          const parts=[];
          if(p.medicalPlan) parts.push("Dietary Plan: "+p.medicalPlan+(p.customPlanNote?" ("+p.customPlanNote+")":""));
          const allAllergies=[...(p.medicalAllergies||[])];
          if(p.medicalAllergiesCustom) allAllergies.push(p.medicalAllergiesCustom);
          if(allAllergies.length>0) parts.push("ALLERGIES (HARD STOP - never include): "+allAllergies.join(", "));
          if((p.medications||[]).length>0) parts.push("Medications: "+p.medications.filter(m=>m.name).map(m=>m.name+(m.dose?" "+m.dose:"")+(m.schedule||m.freq?" — "+(m.schedule||m.freq):"")).join(", ")+" — avoid known food-drug interactions (warfarin/vitamin K, statins/grapefruit, MAOIs/tyramine, etc)");
          if((p.supplements||[]).length>0) parts.push("Supplements: "+p.supplements.filter(s=>s.name).map(s=>s.name+(s.dose?" "+s.dose:"")+(s.schedule?" — "+s.schedule:"")).join(", "));
          const enf=p.enforcement;if(!enf||enf==="none") return (p.name||"Person")+": "+parts.join("; ");
          parts.push("Enforcement: "+enf+(enf==="strict"?" — NEVER suggest conflicting items":enf==="warn"?" — flag conflicts but may include":enf==="inform"?" — note for informational purposes":""));
          return (p.name||"Person")+": "+parts.join("; ");
        }).join(" | ")+". ";const glp1Members=medProfiles.filter(p=>p.medicalPlan&&(p.medicalPlan.includes("GLP-1")||p.medicalPlan.includes("Pre-Diabetic")||p.medicalPlan.includes("Keto")||p.medicalPlan.includes("Diabetic")));if(glp1Members.length>0){s+="GLYCEMIC INTELLIGENCE: For "+glp1Members.map(p=>p.name||"member").join(", ")+": prioritize low-glycemic ingredients, whole grains over refined, lean protein first. Estimate net carbs per meal. Flag high-GI foods. For GLP-1 users: protein-first meal structure, smaller portions, avoid fried/greasy/sugary foods, target 25-30g protein per meal. ";}const bariatricMembers=medProfiles.filter(p=>p.bariatricPhase);if(bariatricMembers.length>0){s+="BARIATRIC PHASE: "+bariatricMembers.map(p=>(p.name||"member")+" is in "+p.bariatricPhase+" phase"+(p.bariatricPhase==="Liquid"?" (liquids only, max 2 oz per sitting)":p.bariatricPhase==="Pureed"?" (pureed textures only, max 4 oz per sitting)":p.bariatricPhase==="Soft"?" (soft foods only, max 6 oz per sitting)":p.bariatricPhase==="Solid"?" (normal textures, small portions, max 8 oz per sitting)":"")).join("; ")+". ";}const medFlagMembers=medProfiles.filter(p=>(p.medications||[]).length>0);if(medFlagMembers.length>0){const medFlags=[];medFlagMembers.forEach(p=>{const meds=(p.medications||[]).map(m=>(m.name||"").toLowerCase());const name=p.name||"member";if(meds.some(m=>m.includes("warfarin")||m.includes("coumadin"))) medFlags.push(name+": consistent Vitamin K intake (do not spike with large kale/spinach servings)");if(meds.some(m=>m.includes("atorvastatin")||m.includes("simvastatin")||m.includes("lovastatin")||m.includes("rosuvastatin")||m.includes("statin")||m.includes("lipitor")||m.includes("crestor"))) medFlags.push(name+": AVOID grapefruit in any form");if(meds.some(m=>m.includes("metformin"))) medFlags.push(name+": prioritize B12-rich foods (eggs, fish, dairy, meat)");if(meds.some(m=>m.includes("levothyroxine")||m.includes("synthroid"))) medFlags.push(name+": limit large portions of cruciferous vegetables");if(meds.some(m=>m.includes("lisinopril")||m.includes("enalapril")||m.includes("ramipril"))) medFlags.push(name+": moderate potassium foods");if(meds.some(m=>m.includes("oxycodone")||m.includes("hydrocodone")||m.includes("morphine"))) medFlags.push(name+": prioritize high-fiber foods for digestive regularity");});if(medFlags.length>0) s+="MEDICATION-FOOD FLAGS: "+medFlags.join("; ")+". ";}const conditionMembers=medProfiles.filter(p=>p.medicalPlan&&(p.medicalPlan.includes("High Cholesterol")||p.medicalPlan.includes("Gout")||p.medicalPlan.includes("GERD")||p.medicalPlan.includes("Osteoporosis")||p.medicalPlan.includes("MIND")||p.medicalPlan.includes("Anti-Inflammatory")||p.medicalPlan.includes("High-Protein")));if(conditionMembers.length>0){s+="CONDITION FLAGS: "+conditionMembers.map(p=>{if(p.medicalPlan.includes("High Cholesterol")) return (p.name||"member")+": limit saturated fat, prioritize omega-3 fish, oats, legumes";if(p.medicalPlan.includes("Gout")) return (p.name||"member")+": avoid red meat, organ meats, shellfish - prioritize low-purine foods";if(p.medicalPlan.includes("GERD")) return (p.name||"member")+": avoid acidic/spicy/fried foods, smaller gentler meals";if(p.medicalPlan.includes("Osteoporosis")) return (p.name||"member")+": prioritize calcium and Vitamin D foods";if(p.medicalPlan.includes("MIND")) return (p.name||"member")+": leafy greens, berries, nuts, whole grains, fish, olive oil";if(p.medicalPlan.includes("Anti-Inflammatory")) return (p.name||"member")+": prioritize anti-inflammatory foods - fatty fish, turmeric, ginger, berries, olive oil";if(p.medicalPlan.includes("High-Protein")) return (p.name||"member")+": prioritize 30g+ protein per meal, lean meats, eggs, legumes, Greek yogurt";return "";}).filter(Boolean).join("; ")+". ";}
      }
    }
    // Kitchen appliance context
    if(kitchenAppliances&&kitchenAppliances.length>0){
      const standardLabel=KITCHEN_APPLIANCES.filter(a=>kitchenAppliances.includes(a.id)).map(a=>a.label);
      const customAppliances=kitchenAppliances.filter(id=>!KITCHEN_APPLIANCES.some(a=>a.id===id));
      const all=[...standardLabel,...customAppliances];
      if(all.length>0) s+="AVAILABLE COOKING EQUIPMENT beyond standard stovetop/oven/microwave (use these methods where appropriate to add variety): "+all.join(", ")+". ";
    }
    return s;
  };

  // -- Support Chat -----------------------------------------------------------
  const userName=user?.user_metadata?.full_name||user?.email?.split("@")[0]||"there";
  const TOUR_STEPS=[
    {msg:"First things first — let's get you signed in so everything is saved to your account. See the **Sign In** button in the top right corner? Tap that when you're ready — it only takes a minute and there's no credit card required. I'll be right here waiting! 😊", tab:null, action:null, autoOpen:false, waitForDone:true, donePrompt:"Take your time! Once you're signed in or have created your account, just say **done** and we'll move to the next step. 😊"},
    {msg:"Great! Let's start with your **family profile** — this tells Smart Kitchen who it's cooking for and any dietary needs. I'm opening that for you now!", tab:"mealplan", action:"profileModalOpen", autoOpen:true, waitForDone:true, donePrompt:"Take your time setting up your family. When you're ready, just say **done** or **next** and we'll move on! And if you have any questions, just ask — I'm right here. 😊"},
    {msg:"Perfect. Now let's build your **inventory** — I'm taking you there now! You can scan a grocery receipt with your camera, or add items manually.", tab:"inventory", autoOpen:true, waitForDone:true, donePrompt:"Go ahead and add a few items — scan a receipt or type them in. Say **done** or **next** when you're ready to continue! And if you have any questions along the way, just ask — I'm right here. 😊"},
    {msg:"Now for the fun part — I'm opening your **Meal Plan** now! Hit **Build Meal Plan** to build your first 7-day dinner plan based on your inventory and family needs.", tab:"mealplan", autoOpen:true, waitForDone:true, donePrompt:"Hit **Build Meal Plan** to generate your first week of dinners. Say **done** or **next** when you've had a look! Any questions, just ask. 😊"},
    {msg:"Your meal plan is ready! You can push it straight to **Google Calendar** with one tap — just hit the Calendar button. Once you've done that (or if you'd like to skip), let me know!", tab:null},
    {msg:"One more thing — see the **⚡ Busy?** button on each day? Tap it on a hectic evening and Smart Kitchen will swap in a quick meal under 20 minutes. Really handy for sports nights! Shall I show you anything else?", tab:"mealplan"},
    {msg:"You're all set! 🎉 Smart Kitchen is ready to help your family eat well every week. I'll be right here if you ever have questions, run into anything, or just want to tell us what you think — good, bad, or anything in between. You're never alone in this kitchen! 💛", tab:null, done:true},
  ];
  const addChatMsg=(role,text)=>setChatMessages(prev=>[...prev,{role,text,id:Date.now()}]);
  const escalateToSupport=(userMsg,tag)=>{
    const profile=familySummary();
    const subject=`Smart Kitchen ${tag} — ${userName} (${tier})`;
    const body=`User: ${userName}%0ATier: ${tier}%0ATag: ${tag}%0A%0AMessage:%0A"${userMsg}"%0A%0AProfile:%0A${profile}`;
    window.open(`mailto:thesmartkitchenapp@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`);
  };
  const detectEscalation=(msg)=>{
    const m=msg.toLowerCase();
    if(m.match(/bug|broken|crash|error|doesn.t work|not working|glitch|freeze/)) return "Bug";
    if(m.match(/scanner|scan|receipt|camera|photo/)) return "Scanner-Issue";
    if(m.match(/allerg|restrict|diabeti|renal|sodium|sugar|carb|kylie|diet/)) return "Dietary-Concern";
    if(m.match(/too expensive|can.t afford|not worth|won.t upgrade|why pay|cancel/)) return "Upgrade-Objection";
    if(m.match(/love|great|amazing|fantastic|helpful|awesome|thank/)) return "Feedback-Positive";
    if(m.match(/confus|lost|don.t understand|how do i|where is|can.t find/)) return "Confusion";
    if(m.match(/feature|wish|would be nice|suggestion|add|could you/)) return "Feature-Request";
    if(m.match(/frustrat|annoying|hate|useless|terrible|awful/)) return "Feedback-Negative";
    return null;
  };
  const tourJustStartedRef=useRef(false);
  const sendChatMessage=async(overrideMsg,voiceMode=false)=>{
    const text=(overrideMsg||chatInput).trim();
    if(!text||chatLoading) return;
    setChatInput("");
    setProactiveQuickReplies([]);
    addChatMsg("user",text);
    setChatLoading(true);
    const m=text.toLowerCase();
    // Wizard re-launch trigger
    if(m.match(/setup wizard|initial setup|redo setup|restart setup|run setup|open setup|launch setup|setup again|family setup|add family|kitchen setup|appliance setup|run the setup|start the setup|rerun the setup/)){
      setTimeout(()=>{
        addChatMsg("assistant","Opening the Setup Wizard now! \uD83D\uDE0A We'll walk through family profiles, kitchen appliances, and your inventory.");
        setTimeout(()=>{
          try{localStorage.removeItem("sk_setupDone");}catch{}
          setTab("mealplan");
          setWizardStep(user?0:-3);
          setShowWizard(true);
        },800);
        setChatLoading(false);
      },400);
      return;
    }
        // Handle yes/no to tour offer
    if(tourChoice===null){
      if(m.match(/^yes|^sure|^yeah|^yep|^absolutely|^please/)){
        const startStep=user?2:1;
        const firstStep=TOUR_STEPS[startStep-1];
        setTourChoice("yes");
        setTourStep(startStep);
        try{localStorage.setItem("sk_tourChoice","yes");localStorage.setItem("sk_tourStep",String(startStep));}catch{}
        const ackMsg=user
          ?`Perfect! Let\u2019s do this together. I\u2019ll keep it simple and you can ask questions anytime. \uD83D\uDE0A`
          :`Perfect! Let\u2019s do this together \u2014 I\u2019ll walk you through every step. \uD83D\uDE0A`;
        setTimeout(()=>{
          addChatMsg("assistant",ackMsg);
          setTimeout(()=>{
            addChatMsg("assistant",firstStep.msg);
            setChatLoading(false);
          },1200);
        },600);
        return;
      } else if(m.match(/^no|^not now|^skip|^later|^nope/)){
        setTourChoice("no");
        try{localStorage.setItem("sk_tourChoice","no");}catch{}
        setTimeout(()=>{addChatMsg("assistant",`No problem at all! I\u2019ll be right here whenever you need me. Explore at your own pace \u2014 and tap the chat bubble any time you have questions or just want to talk. \uD83D\uDC9B`);setChatLoading(false);},600);
        return;
      }
    }
    // Handle tour step responses
    if(tourChoice==="yes"&&tourStep>0&&tourStep<=TOUR_STEPS.length){
      const step=TOUR_STEPS[tourStep-1];
      const isDone=text.toLowerCase().match(/done|next|ready|finished|complete|moved on|got it|continue|signed in|logged in|created/);
      // If step requires completing an action, wait for done signal
      if(step.waitForDone&&!isDone){
        // Auto-open tab or auth if not already done
        if(step.autoOpen){
          if(step.action==="openAuth"&&!user) onUpgrade();
          else if(step.tab){ setTab(step.tab); if(step.action==="profileModalOpen") setProfileModalOpen(true); }
        }
        setTimeout(()=>{addChatMsg("assistant",step.donePrompt||"No rush! Just say **done** or **next** when you're ready to continue.");setChatLoading(false);},700);
        return;
      }
      // Advance tour
      const nextStep=tourStep+1;
      setTourStep(nextStep);
      try{localStorage.setItem("sk_tourStep",String(nextStep));}catch{}
      if(nextStep<=TOUR_STEPS.length){
        const next=TOUR_STEPS[nextStep-1];
        // Skip sign-in step if already signed in
        if(next.action==="openAuth"&&user){
          const skipStep=nextStep+1;
          setTourStep(skipStep);
          try{localStorage.setItem("sk_tourStep",String(skipStep));}catch{}
          const skipNext=TOUR_STEPS[skipStep-1];
          if(skipNext){
            setTimeout(()=>{
              addChatMsg("assistant",skipNext.msg);
              if(skipNext.autoOpen&&skipNext.tab){
                setTimeout(()=>{
                  setShowWizard(false);
                  try{localStorage.setItem("sk_setupDone","1");sessionStorage.removeItem("sk_newSignup");}catch{}
                  setTab(skipNext.tab);
                  if(skipNext.action==="profileModalOpen") setProfileModalOpen(true);
                },800);
              }
              setChatLoading(false);
            },700);
          }
          return;
        }
        setTimeout(()=>{
          addChatMsg("assistant",next.msg);
          if(next.autoOpen){
            setTimeout(()=>{
              if(next.action==="openAuth"&&!user) onUpgrade();
              else if(next.tab){
                // Close wizard when navigating to app tabs
                setShowWizard(false);
                try{localStorage.setItem("sk_setupDone","1");}catch{}
                setTab(next.tab);
                if(next.action==="profileModalOpen") setProfileModalOpen(true);
              }
            },800);
          }
          setChatLoading(false);
        },700);
        if(next.done){try{localStorage.setItem("sk_tourChoice","done");}catch{} setTourChoice("done");}
      } else {
        setTimeout(()=>{addChatMsg("assistant","You're all set! I'm always here if you need anything. 💛");setChatLoading(false);},700);
      }
      return;
    }
    
    // Check for escalation tags
    const tag=detectEscalation(text);
    if(tag&&tag!=="Feedback-Positive") setTimeout(()=>escalateToSupport(text,tag),2000);
    // Build system prompt with full user context
    const profile=familySummary();
    const invSummary=`${inventory.length} items, ${proteinItems?.length||0} proteins`;
    const mealSummary=mealPlan.length>0?`Current meal plan: ${mealPlan.map(d=>d.day+": "+d.meal).join(", ")}`:"No meal plan yet";
    const system=`You are the Smart Kitchen assistant — warm, friendly, and genuinely helpful. Your name is not important; you are the voice of Smart Kitchen, Rick Rinehart's app.

VOICE: Warm, conversational, encouraging. The user is always in control but they should always feel they are never alone. Never robotic. Never overly formal. Speak like a knowledgeable friend who loves cooking and cares about this family.

USER CONTEXT:
- Name: ${userName}
- Tier: ${tier}
- ${profile||"No dietary restrictions set"}
- Inventory: ${invSummary}
- ${mealSummary}
- Senior Mode: ${seniorMode?"ON":"OFF"}

APP KNOWLEDGE: Smart Kitchen has these features:
- Inventory: scan receipts or add manually. Wild Harvest and Home Harvest categories with label printing.
- Meal Plan: 7-day AI dinner plan. Regenerate or Change individual meals. Occasion Planner (🎉 Plan Occasion button) for special events — Dinner Party, Date Night, Birthday Dinner, BBQ, Kids Party — generates one occasion meal, picks a date, slots into meal plan or pushes to Google Calendar.
- Recipes & Saved: AI recipe suggestions. Star-rate meals. 5-star = Keeper on rotation.
- RECIPE SHARING: Share button on Saved tab and Family Recipes modal. Select any recipes, tap Share, get a 6-character code. Text or email the code to anyone. They tap Import on their Saved tab, enter the code, see a preview, and tap "Add All to My Kitchen." Family Recipes import directly to Family Recipes; Saved recipes go to Saved. Codes valid 90 days. Deep link also works — tapping the link auto-opens the import modal with the code pre-filled.
- MOVING RECIPES: On any Saved recipe card, tap "📖 Add to Family" to move it to Family Recipes. Inside a Family Recipe view, tap "⭐ Add to Saved" to copy it to Saved Recipes.
- Shopping List: auto-builds from meal plan. Email, SMS (Text to... button — add phone in Settings), and Send to Instacart (opens Meijer/ALDI/Kroger/etc with items ready to shop — set preferred store in Settings).
- Family Profiles: per-member dietary restrictions, Date of Birth (birthday countdown, 🎂 banner on meal plan week, age-aware AI meals), Medical+ for medication/allergy compliance.
- Bluetooth Scale (⚖ Scale, Medical+ only): connect Etekcity Nutrition Scale, weigh portions, get instant calorie/nutrition estimates.
- Leftovers scanner (photo identifies dish, estimates servings, sets use-by date — if unrecognized shows "I'm not sure what this is" prompt), Substitute tool, Weekly Ad scanner, Desserts, Busy Night flag (⚡).
- Senior Mode (Aa Off/On button): larger text, bigger tap targets, larger checkboxes on shopping list.
- Family Recipes: tap Family Recipes button in top bar. Add, edit, delete, share individual recipes. Share All shares every family recipe at once. Cross-device sync — recipes available on all your devices.
- Support chat, Google Calendar, Receipt scanner.
- SETUP WIZARD: If the user asks to redo setup, add family members, set up appliances, or walk through onboarding again, the chat can relaunch the Setup Wizard automatically. Just say something like "Sure! Let me open the Setup Wizard for you now." The system will handle the rest.

ESCALATION: If the user reports a bug, scanner problem, dietary concern, frustration, or upgrade objection — acknowledge it warmly and let them know the team has been notified and will follow up. If they give positive feedback — celebrate it genuinely.

FEEDBACK: You actively want to hear feedback — good, bad, and ugly. If someone seems hesitant or disengaged, gently ask what's not working for them. If they mention not upgrading, ask what would make it worth it. Always listen first.

Keep responses concise — 2-4 sentences max unless explaining a feature. Use plain language. No bullet points unless listing steps.`;
    try{
      const history=chatMessages.slice(-8).map(m=>({role:m.role,content:m.text}));
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":import.meta.env?.VITE_ANTHROPIC_API_KEY||"","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:400,system,messages:[...history,{role:"user",content:text}]}),
      });
      const data=await res.json();
      const reply=data?.content?.[0]?.text||"I'm having a little trouble right now — please try again in a moment.";
      addChatMsg("assistant",reply);
      if(voiceMode){
        // Strip markdown for voice (remove **, *, #, bullet chars)
        const spokenReply=reply.replace(/\*\*|\*|#{1,3} |^[\u2022\-] /gm,"").replace(/\n+/g," ").trim();
        speak(spokenReply);
        setShowVoicePanel(true);
      }
    }catch(e){
      addChatMsg("assistant","Something went wrong on my end. Please try again — and if this keeps happening, the team will want to know about it!");
    }
    setChatLoading(false);
  };
  const openChat=()=>{
    setChatOpen(true);
    if(!chatWelcomeDone){
      setChatWelcomeDone(true);
      try{localStorage.setItem("sk_chatWelcomeDone","1");}catch{}
      const greeting=`Hi ${userName}! 👋 Welcome to Smart Kitchen — I'm so glad you're here.\n\nI'm your kitchen assistant. I can help you get set up, answer questions, and I genuinely want to hear what you think — good, bad, or anything in between.\n\nWould you like a quick guided tour to get started? I'll walk you through everything one step at a time, and you're in control the whole way. Just say **yes** or **no** — no pressure either way! 😊`;
      setTimeout(()=>addChatMsg("assistant",greeting),400);
    } else if(chatMessages.length===0){
      setTimeout(()=>addChatMsg("assistant",`Welcome back, ${userName}! 😊 What can I help you with today? And if anything's on your mind — about the app or anything else — I'm all ears.`),400);
    }
  };
  useEffect(()=>{
    chatEndRef.current?.scrollIntoView({behavior:"smooth"});
  },[chatMessages]);

  // -- Repackage helpers ------------------------------------------------------
  const openRepack=(mode)=>{setRpMode(mode);setRpPName("");setRpPLbs("");setRpPOz(6);setRpPPreview(null);setRpHItem("");setRpHRaw("");setRpHOz(16);setRpOpen(true);};
  const commitProtein=()=>{
    if(!rpPName||!rpPLbs) return;
    const portions=Math.floor((parseFloat(rpPLbs)*16)/rpPOz);
    const pName=rpPName;
    setInventory(prev=>{
      const idx=prev.findIndex(i=>i.name.toLowerCase()===pName.toLowerCase());
      if(idx>=0) return prev.map((i,ii)=>ii===idx?{...i,qty:i.qty+portions,isBulkProtein:true,portionOz:rpPOz}:i);
      return [...prev,{id:Date.now(),name:pName,qty:portions,unit:"portions",category:"Protein",location:"Freezer",isBulkProtein:true,portionOz:rpPOz}];
    });
    setRpOpen(false);
    setTimeout(()=>{
      setBatchPrintCue({itemName:pName,qty:portions,unit:"portions",format:"5163",category:"Protein"});
    },400);
  };
  const commitVeg=()=>{
    const valid=rpVSessions.filter(s=>s.bags&&s.bags>0);
    if(!valid.length) return;
    const totalBags=valid.reduce((s,v)=>s+v.bags,0);
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
    setTimeout(()=>{
      setBatchPrintCue({itemName:"Mixed Sauté Blend",qty:totalBags,unit:"2-cup bags",format:"5163",category:"SauteBlend"});
    },400);
  };
  // Wild Harvest: deterministic weight->portion math, same formula as commitProtein, tagged to Wild Harvest category
  const commitHarvestWild=()=>{
    if(!rpHItem||!rpHRaw) return;
    const portions=Math.floor((parseFloat(rpHRaw)*16)/rpHOz);
    if(portions<1) return;
    const itemName=rpHItem;
    setInventory(prev=>{
      const idx=prev.findIndex(i=>i.name.toLowerCase()===itemName.toLowerCase()&&i.category==="Wild Harvest");
      if(idx>=0) return prev.map((i,ii)=>ii===idx?{...i,qty:i.qty+portions,portionOz:rpHOz}:i);
      return [...prev,{id:Date.now(),name:itemName,qty:portions,unit:"portions",category:"Wild Harvest",harvestType:"Protein",location:"Freezer",isBulkProtein:true,portionOz:rpHOz}];
    });
    setRpOpen(false);
    setTimeout(()=>{
      setBatchPrintCue({itemName,qty:portions,unit:"portions",format:"5163",category:"Wild Harvest"});
    },400);
  };
  // Home Harvest: estimate via HARVEST_YIELD table, routes through the generalized Yield Confirm modal (bulk produce only)
  const estimateHarvestHome=()=>{
    if(!rpHItem||!rpHRaw) return;
    const y=getHarvestYield(rpHItem);
    const rate=y.rate[rpHForm]??y.rate.Fresh??1;
    const estimated=Math.max(1,Math.round(parseFloat(rpHRaw)*rate));
    setRpYieldConfirm({type:"homeHarvest",estimated,unit:y.outputUnit[rpHForm]||"units",itemName:rpHItem,form:rpHForm,rawQty:rpHRaw,rawUnit:y.rawUnit});
    setRpActualBags(String(estimated));
  };
  // Home Harvest: deterministic math for meat/liquid/dairy/count items — same exact-arithmetic pattern as Wild Harvest, no yield guesswork needed
  const getHarvestMeasurePref=(name)=>{
    try{ const p=JSON.parse(localStorage.getItem("sk_harvestMeasurePrefs")||"{}"); return p[name]||null; }catch{ return null; }
  };
  const saveHarvestMeasurePref=(name,measure,size)=>{
    try{
      const p=JSON.parse(localStorage.getItem("sk_harvestMeasurePrefs")||"{}");
      p[name]={measure,size};
      localStorage.setItem("sk_harvestMeasurePrefs",JSON.stringify(p));
    }catch{}
  };
  const commitHarvestDeterministic=()=>{
    if(!rpHItem||!rpHRaw) return;
    const p=HOME_PRODUCE.find(x=>x.name===rpHItem);
    const cfg=MEASURE_CONFIG[rpHMeasure]||MEASURE_CONFIG.lbs;
    const hType=p?.hType||"Produce";
    const hLoc=p?.hLoc||"Fridge";
    const raw=parseFloat(rpHRaw);
    const qty=cfg.sizeOptions?cfg.calc(raw,rpHOz):cfg.calc(raw);
    if(qty<1) return;
    const itemName=rpHItem;
    setInventory(prev=>{
      const idx=prev.findIndex(i=>i.name.toLowerCase()===itemName.toLowerCase()&&i.category==="Home Harvest");
      if(idx>=0) return prev.map((i,ii)=>ii===idx?{...i,qty:i.qty+qty,portionOz:cfg.sizeOptions?rpHOz:i.portionOz}:i);
      return [...prev,{id:Date.now(),name:itemName,qty,unit:cfg.outputUnit,category:"Home Harvest",harvestType:hType,location:hLoc,isBulkProtein:hType==="Protein",portionOz:cfg.sizeOptions?rpHOz:undefined}];
    });
    setRpOpen(false);
    setTimeout(()=>{
      setBatchPrintCue({itemName,qty,unit:cfg.outputUnit,format:hType==="Protein"?"5163":"5160",category:"Home Harvest"});
    },400);
  };

  // -- Scan -------------------------------------------------------------------
  const onFile=async(file)=>{
    if(!file) return;
    setScanPreview(URL.createObjectURL(file));
    setScanB64(await fileToBase64(file));
    setScanMime(file.type||"image/jpeg");
    setScanResults(null); setScanStage("upload");
  };
  const onFiles=async(files)=>{
    if(!files||files.length===0) return;
    if(files.length===1){onFile(files[0]);return;}
    setScanStage("analyzing");
    setLoading(true); setLoadMsg("Reading weekly ad ("+files.length+" pages)...");
    let allItems=[];
    try{
      for(let i=0;i<files.length;i++){
        setLoadMsg("Reading page "+(i+1)+" of "+files.length+"...");
        const b64=await fileToBase64(files[i]);
        const mime=files[i].type||"image/jpeg";
        const raw=await callClaude({
          system:"You are a grocery store weekly ad parser. Analyze this store ad image and extract food/grocery sale items. Return ONLY a valid JSON array. Each object: {name(string, clean product name), salePrice(string, e.g. '$2.99'), regularPrice(string or null), unit(string, e.g. 'lb' 'each' 'pkg'), category(Protein|Produce|Dairy|Pantry|Grains|Frozen|Condiments|Other), savings(string, e.g. 'Save $1.00' or 'BOGO' or '2 for $5')}. Focus on food items only. Skip non-food deals.",
          prompt:"Extract all food sale items from this weekly grocery ad. Include sale price, unit, and any savings details visible.",
          imageBase64:b64,imageType:mime,
        });
        const s=raw.indexOf("["),e=raw.lastIndexOf("]");
        if(s!==-1){
          const parsed=JSON.parse(raw.slice(s,e+1));
          allItems=allItems.concat(parsed);
        }
      }
      const seen=new Set();
      allItems=allItems.filter(i=>{const k=i.name.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
      setSaleItems(allItems);
      setScanStage("review");
      setScanResults(allItems.map(i=>({...i,selected:false,qty:1,location:"Store",action:"sale"})));
      setScanPreview(null); setScanB64(null);
    } catch(e){ alert("Ad scan failed: "+e.message); setScanStage("upload"); }
    setLoading(false);
  };
  async function lookupUPC(upc){
    if(!upc||String(upc).length<8)return null
    try{
      const{data:cached}=await supabase.from('upc_cache').select('*').eq('upc',String(upc)).single()
      if(cached){const age=(Date.now()-new Date(cached.last_refreshed).getTime())/(1000*60*60*24);if(age<90)return cached}
      const res=await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`)
      if(!res.ok)return cached||null
      const data=await res.json()
      const item=data?.items?.[0]
      if(!item)return cached||null
      const record={upc:String(upc),name:item.title||item.description||null,brand:item.brand||null,size:item.size||item.weight||null,category:item.category||null,image_url:item.images?.[0]||null,nutrition:item.nutrition||{},ingredients:item.ingredients||null,last_refreshed:new Date().toISOString()}
      await supabase.from('upc_cache').upsert(record,{onConflict:'upc'})
      return record
    }catch(e){console.warn('UPC lookup error:',e);return null}
  }
  async function enrichItemsWithUPC(items){
    const results=[]
    for(let i=0;i<items.length;i+=5){
      const batch=items.slice(i,i+5)
      const enriched=await Promise.all(batch.map(async(item)=>{
        if(!item.upc)return item
        const u=await lookupUPC(item.upc)
        if(!u)return item
        return{...item,name:u.name||item.name,brand:u.brand||null,size:u.size||null,image_url:u.image_url||null,nutrition:u.nutrition||{},ingredients:u.ingredients||null,upc_enriched:true}
      }))
      results.push(...enriched)
      if(i+5<items.length)await new Promise(r=>setTimeout(r,500))
    }
    return results
  }
  const analyzeReceipt=async()=>{
    if(!scanB64) return;
    setScanStage("analyzing");
    setLoading(true); setLoadMsg("Reading receipt…");
    try{
      const raw=await callClaude({
        system:"You are a grocery receipt parser specialized in Meijer store receipts. Analyze this receipt image and extract every food/grocery item purchased. Return ONLY a valid JSON array. No markdown, no preamble.\n\nRULES:\n1. DUPLICATE HANDLING: If the EXACT same product appears multiple times (same name, same price), combine into one object with summed qty. However if similar items appear with DIFFERENT SKUs or flavors (e.g. two different ice cream flavors), keep them SEPARATE but flag confidence as medium. If an item has quantity printed (e.g. '2 @ $1.99'), use that quantity.\n2. UNIT RULES: Bananas/grapes→bunch. Milk→gallon. Eggs→dozen. Bread→loaf. Meat/fish by weight→lb. Ice cream/frozen novelty→container. Produce bags (onions/potatoes)→bag. Canned goods→can. Bottles→bottle. Multi-packs→count. Default→each.\n3. LOCATION RULES (MUST follow exactly): Protein/Meat/Seafood/Poultry/Pork/Beef/Fish/Ice cream/Frozen→Freezer. Dairy/Eggs/Deli/Juice/Condiments/Dressings→Fridge. Fresh produce (bananas/apples/oranges/tomatoes/peppers)→Fridge. Bagged produce (onions/potatoes/carrots)→Pantry. Canned/Dry/Spices/Grains/Baking/Snacks/Beverages→Pantry.\n4. RECEIPT SPECIFICS: Ignore PLU numbers, discount lines (SAVE, MPERKS, COUPON, MFR), tax lines, subtotals and totals. Clean brand names (MEIJER ORG→Organic [Item], WB→Wright Brand). Works with any retailer.\n5. UPC CODES: If a 12-digit UPC barcode number is visible next to an item, capture it in the upc field. Set upc to null if not visible.\n6. CONFIDENCE: high=clearly readable name+price. medium=similar items or slightly unclear. low=guessed from partial text.\n\nEach object: {name, qty(number), unit, category(Protein|Produce|Dairy|Pantry|Baking|Grains|Spices|Frozen|Condiments|Other), location(Freezer|Fridge|Pantry), isProtein(boolean), price(string), upc(string|null), confidence(high|medium|low), expiryDays(number|null, estimated days until expiry: fresh meat=2, ground beef=2, pork=3, chicken=2, fish=1, milk=7, eggs=21, cheese=14, yogurt=10, fresh produce=5, bananas=5, bread=5, deli meat=5, frozen=180, canned=730, dry goods=365, condiments=180, null for pantry staples with very long shelf life)}. Skip non-food items.",
        prompt:"Parse this grocery receipt. Extract every food item purchased with quantity and category.",
        imageBase64:scanB64,imageType:scanMime,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1) throw new Error("Could not read receipt");
      let parsed=JSON.parse(raw.slice(s,e+1));
      // Strip Meijer * prefix from item codes and normalize UPCs
      parsed=parsed.map(i=>({
        ...i,
        upc:i.upc?String(i.upc).replace(/[^0-9]/g,'').slice(-12)||null:null
      }))
      const isUpd=(name)=>inventory.some(i=>i.name.toLowerCase()===name.toLowerCase());
      const smartLoc=(item)=>{if(item.location)return item.location;if(item.category==="Protein")return"Freezer";if(item.category==="Dairy")return"Fridge";if(item.category==="Condiments")return"Fridge";if(item.category==="Frozen")return"Freezer";if(item.category==="Produce")return"Fridge";return"Pantry";};
      const initialResults=parsed.map(i=>({...i,location:smartLoc(i),action:isUpd(i.name)?"update":"add",selected:true}))
      setScanResults(initialResults);
      setScanStage("review");
      // Background UPC enrichment — doesn't block showing results
      if(initialResults.some(i=>i.upc)){
        enrichItemsWithUPC(initialResults).then(enriched=>{
          setScanResults(enriched.map((i,idx)=>({...i,location:initialResults[idx]?.location||i.location,action:initialResults[idx]?.action||i.action,selected:initialResults[idx]?.selected??true})))
        }).catch(e=>console.warn('Background UPC enrichment failed:',e))
      }
    } catch(e){ alert("Receipt scan failed: "+e.message); }
    setLoading(false);
  };

  const analyzePhoto=async()=>{
    if(!scanB64) return;
    setScanStage("analyzing");
    setLoading(true); setLoadMsg("Scanning shelf photo…");
    try{
      const raw=await callClaude({
        system:"Kitchen inventory AI. Analyze the photo. Return ONLY valid JSON array. Each item: {name,qty,unit,category,location,confidence,expiryDays}. category rules (STRICT): Protein = ONLY actual meat, poultry, seafood, fish, eggs as protein source. Produce = fresh fruits and vegetables. Dairy = milk, cheese, yogurt, butter, cream. Baking = flour, sugar, baking soda, baking powder, chocolate chips, extracts, shortening, oils used for baking. Grains = rice, pasta, bread, oats, cereals. Spices = spices, herbs, seasoning blends, salt, pepper. Condiments = sauces, dressings, ketchup, mustard, mayo, relish, vinegar, soy sauce. Frozen = frozen packaged foods. Pantry = canned goods, beverages, snacks, cleaning products, detergents, paper goods, health products, bug spray, household items, or ANYTHING that does not clearly fit another category. Other = non-food items you are unsure about. DEFAULT to Pantry when uncertain - NEVER default to Protein. location rules (MUST follow): Protein/Meat/Seafood/Poultry/Pork/Beef/Fish = Freezer. Dairy/Eggs/Fresh Produce/Deli meats/Condiments/Dressings = Fridge. Canned goods/Dry goods/Spices/Grains/Baking/Snacks/Beverages/Household = Pantry. Frozen packaged foods = Freezer. confidence is high, medium, or low. expiryDays is estimated days until expiry once opened or from purchase: fresh meat/poultry=2, pork=3, fish=1, ground beef=2, milk=7, eggs=21, cheese=14, yogurt=10, fresh produce=5, bananas=5, bread=5, deli meat=5, frozen=180, canned=730, dry goods=365, condiments=180, null for very long shelf life staples.",
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
  const analyzeWhiteboard=async()=>{
    if(!scanB64) return;
    setScanStage("analyzing");
    setLoading(true); setLoadMsg("Reading your list…");
    try{
      const raw=await callClaude({
        system:"You are reading a handwritten or whiteboard shopping list photo. Extract every item written down, even if handwriting is messy or words are misspelled — use your best judgment to identify the intended grocery or household item. Return ONLY a valid JSON array. Each object: {name(string, cleaned up and correctly spelled product name), category(Protein|Produce|Dairy|Pantry|Grains|Frozen|Condiments|Household|Other)}. Include every item you can identify, including household and personal care items, not just food.",
        prompt:"Read this handwritten shopping list and extract every item written on it.",
        imageBase64:scanB64,imageType:scanMime,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1) throw new Error("Could not read the list");
      const parsed=JSON.parse(raw.slice(s,e+1));
      setScanStage("review");
      setScanResults(parsed.map(i=>({...i,selected:true,qty:1,location:"Store",action:"whiteboard"})));
    } catch(e){ alert("List scan failed: "+e.message); }
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
      setScanResults(parsed.map(i=>({...i,selected:false,qty:1,location:"Store",action:"sale"})));
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
        if(idx>=0){u[idx]={...u[idx],qty:si.qty,unit:si.unit,location:si.location,upc:si.upc||u[idx].upc||null,brand:si.brand||u[idx].brand||null,size:si.size||u[idx].size||null,nutrition:Object.keys(si.nutrition||{}).length?si.nutrition:u[idx].nutrition||{},image_url:si.image_url||u[idx].image_url||null,upc_enriched:si.upc_enriched||u[idx].upc_enriched||false};}
        else{u.push({id:Date.now()+Math.random(),name:si.brand&&si.size?`${si.brand} ${si.name} ${si.size}`.trim():si.name,qty:si.qty,unit:si.unit,category:si.category,location:si.location,isProtein:!!si.isProtein,price:si.price||null,expiryDays:si.expiryDays||null,upc:si.upc||null,brand:si.brand||null,size:si.size||null,nutrition:si.nutrition||{},image_url:si.image_url||null,upc_enriched:!!si.upc_enriched});}
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
        system:"Return ONLY a JSON array of 4 dinner recipes. No other text. Start with [ end with ]. Each object has exactly these keys: id (number), name (string), time (string like 30 min), difficulty (Easy or Medium or Hard), description (one short sentence), usesFromInventory (array of 3 strings max), missingIngredients (array of strings), instructions (array of 4 short strings). Keep all strings short."+(fs?" CRITICAL DIETARY RULES — these are HARD STOPS, never violate them: "+fs:""),
        prompt:"Proteins: "+proteins+". Saute blend bags: "+(blendItem?.qty||0)+". Make 4 simple weeknight dinners for 3 people. Vary proteins — include beef and pork not just chicken. Pantry/fridge inventory (match case-insensitively): "+inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")+". For missingIngredients only list items NOT in that inventory."+(fs?" ENFORCE these dietary rules in every recipe: "+fs:""),
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
      const occCtx=buildOccasionContext(occasionState)+(occasionCustomText?" Special occasion name: "+occasionCustomText+".":"");
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
  const printLabels=()=>{
    const selectedItems=[];
    inventory.filter(i=>labelSelected[i.name]).forEach(i=>{
      const n=Math.max(1,parseInt(labelQty[i.name])||1);
      for(let k=0;k<n;k++) selectedItems.push(i);
    });
    const fmts={"5160":{cols:3,rows:10,labelW:2.625,labelH:1,marginL:0.19,marginT:0.5,gapH:0.125,gapV:0,fontSize:6.5,nameFontSize:7.5},"5163":{cols:2,rows:5,labelW:4,labelH:2,marginL:0.15,marginT:0.5,gapH:0.19,gapV:0,fontSize:8,nameFontSize:10},"5164":{cols:2,rows:3,labelW:4,labelH:3.33,marginL:0.15,marginT:0.5,gapH:0.19,gapV:0.25,fontSize:9,nameFontSize:12}};
    const fmt=fmts[labelFormat];
    const toW=(in_)=>in_*96+"px";
    const perSheet=fmt.cols*fmt.rows;
    const sheetCount=Math.max(1,Math.ceil(selectedItems.length/perSheet));
    const grid="display:grid;grid-template-columns:repeat("+fmt.cols+","+toW(fmt.labelW)+");gap:"+toW(fmt.gapV)+" "+toW(fmt.gapH)+";margin-left:"+toW(fmt.marginL)+";margin-top:"+toW(fmt.marginT)+";";
    const sheets=[];
    for(let pg=0;pg<sheetCount;pg++){
      const cells=[];
      for(let s=0;s<perSheet;s++){
        const item=selectedItems[pg*perSheet+s];
        if(item){
          const icon=item.category==="Wild Harvest"?"\uD83E\uDD8C":"\uD83C\uDF31";
          const hLine=item.harvestDate?"Harvested: "+item.harvestDate:(item.addedAt?new Date(item.addedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"");
          const bestBy=item.useBy||"";
          const srv=item.qty&&item.unit?item.qty+" "+item.unit:"";
          const top='<div style="font-size:'+fmt.nameFontSize+'pt;font-weight:700;line-height:1.1;margin-bottom:2px;">'+icon+' '+item.name.toUpperCase()+'</div><div style="font-size:'+fmt.fontSize+'pt;color:#555;">'+item.category+'</div>';
          const mid=labelFormat!=="5160"?'<div style="font-size:'+fmt.fontSize+'pt;color:#333;line-height:1.4;">'+(hLine?hLine+'<br/>':'')+(srv?srv+'<br/>':'')+(bestBy?'Best by: '+bestBy:'')+'</div>':'<div style="font-size:'+fmt.fontSize+'pt;color:#333;">'+(bestBy?'Best by: '+bestBy:'')+'</div>';
          const bot='<div style="font-size:'+(labelFormat==="5160"?5:fmt.fontSize-1)+'pt;color:#999;text-align:right;">Smart Kitchen(tm)</div>';
          cells.push('<div style="width:'+toW(fmt.labelW)+';height:'+toW(fmt.labelH)+';box-sizing:border-box;padding:'+(labelFormat==="5160"?'4px 6px':'8px 10px')+';display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;border:0.5px dashed #ccc;font-family:Arial,sans-serif;"><div>'+top+'</div>'+mid+bot+'</div>');
        } else {
          cells.push('<div style="width:'+toW(fmt.labelW)+';height:'+toW(fmt.labelH)+';box-sizing:border-box;border:0.5px dashed #eee;"></div>');
        }
      }
      sheets.push('<div class="grid" style="'+grid+(pg<sheetCount-1?'page-break-after:always;':'')+'">'+cells.join("")+'</div>');
    }
    const doc="<!DOCTYPE html>"+"<html>"+"<head>"+"<title>Smart Kitchen Labels</title>"+"<style>@media print{body{margin:0;}}</style>"+"</head>"+"<body>"+sheets.join("")+"</body>"+"</html>";
    const win=window.open("","_blank","width=816,height=1056");
    win.document.write(doc);
    win.document.close();
    setTimeout(()=>win.print(),400);
    setLabelSelected({});
    setLabelQty({});
    setLabelModal(false);
  };

  const buildPreferenceSummary=()=>{
    try{
      const made=JSON.parse(localStorage.getItem("sk_madeItHistory")||"[]");
      const changed=JSON.parse(localStorage.getItem("sk_changeMealHistory")||"[]");
      const ratings=JSON.parse(localStorage.getItem("sk_recipeRatings")||"{}");
      const recentMade=made.slice(-20);
      const recentChanged=changed.slice(-20);
      // Meal frequency from Made It history
      const mealCounts={};
      recentMade.forEach(m=>{if(m.meal){const k=m.meal.toLowerCase();mealCounts[k]=(mealCounts[k]||0)+1;}});
      const freqFavs=Object.entries(mealCounts).filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([m,c])=>m+" (cooked "+c+"x)");
      // Star rating signals
      const starBanned=Object.entries(ratings).filter(([,v])=>v?.rating===1).map(([name])=>name);
      const starFive=Object.entries(ratings).filter(([,v])=>v?.rating===5).map(([name])=>name);
      const starFour=Object.entries(ratings).filter(([,v])=>v?.rating===4).map(([name])=>name);
      // 4-week rotation: find 5-star meals made in last 28 days
      const now=Date.now();
      const fourWeeksMs=28*24*60*60*1000;
      const recentFiveStar=recentMade.filter(m=>m.meal&&starFive.includes(m.meal)&&m.ts&&(now-m.ts)<fourWeeksMs).map(m=>m.meal);
      // 5-star meals NOT made in last 28 days — eligible for suggestion (max 3 per week)
      const eligibleFiveStar=starFive.filter(n=>!recentFiveStar.includes(n)).slice(0,3);
      // 4-star meals available for suggestions
      const eligibleFourStar=starFour.filter(n=>!recentFiveStar.includes(n)).slice(0,3);
      // Merge favorites: freq favs + eligible 5-star
      const allFavs=[...new Set([...freqFavs,...eligibleFiveStar.map(n=>n+" (5-star keeper, eligible this week)")])].slice(0,8);
      // Merge rejected: change meal history + 1-star + recently made 5-star (cooldown)
      const allRejected=[...new Set([...recentChanged.map(c=>c.meal).filter(Boolean),...starBanned,...recentFiveStar])].slice(0,15);
      // Protein preference from Made It history
      const proteins=recentMade.map(m=>m.protein).filter(Boolean);
      const proteinCounts={};
      proteins.forEach(p=>{proteinCounts[p]=(proteinCounts[p]||0)+1;});
      const favProteins=Object.entries(proteinCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([p])=>p);
      // Assemble summary
      if(!allFavs.length&&!allRejected.length&&!favProteins.length&&!eligibleFiveStar.length) return "";
      let summary="";
      if(eligibleFiveStar.length) summary+=" 5-STAR KEEPERS ELIGIBLE THIS WEEK (max 3 of these per week — mix with new meals): "+eligibleFiveStar.join(", ")+".";
      if(eligibleFourStar.length) summary+=" 4-STAR FAVORITES (occasionally suggest): "+eligibleFourStar.join(", ")+".";
      if(allFavs.length) summary+=" HOUSEHOLD FAVORITES: "+allFavs.join(", ")+".";
      if(allRejected.length) summary+=" DO NOT SUGGEST THESE (1-star, rejected, or made within last 4 weeks): "+allRejected.join(", ")+".";
      if(favProteins.length) summary+=" PREFERRED PROTEINS: "+favProteins.join(", ")+".";
      summary+=" IMPORTANT: No more than 3 meals per week from the 5-star keeper list. The remaining 4+ meals must be fresh new suggestions not from the keeper list.";
      return summary;
    }catch{return "";}
  };



  // -- Bluetooth Scale (Medical+) -------------------------------------------
  // Etekcity Nutrition Scale — confirmed UUIDs from nRF Connect (MAC: 9A:A9:0A:04:0F:6B)
  const SCALE_SVC="0000fff0-0000-1000-8000-00805f9b34fb";  // Service: 0xFFF0
  const SCALE_CHR_NOTIFY="0000fff1-0000-1000-8000-00805f9b34fb";  // Notify (weight in): 0xFFF1
  const SCALE_CHR_WRITE="0000fff2-0000-1000-8000-00805f9b34fb";   // Write (tare cmd out): 0xFFF2
  function decodeScaleWt(value){
    const bytes=new Uint8Array(value.buffer);
    const rawHex=Array.from(bytes).map(b=>"0x"+b.toString(16).padStart(2,"0")).join(" ");
    console.log("Scale raw bytes ["+bytes.length+"]:",rawHex);
    if(bytes.length<15) return null;
    // Etekcity ENS-L221S confirmed packet format (17 bytes, calibrated June 2026):
    // weight = bytes[11] | (bytes[12]<<8)  little-endian, /10 for grams
    // unit   = bytes[14]: 0x02=g, 0x01=oz, 0x00=lb
    const rawVal=(bytes[11])|(bytes[12]<<8);
    const unitByte=bytes[14];
    let displayVal, unit, grams;
    if(unitByte===0x00){
      // oz: raw/100 (confirmed)
      displayVal=rawVal/100;
      unit="oz";
      grams=displayVal*28.3495;
    } else if(unitByte===0x01){
      // lb: raw/1000 (confirmed)
      displayVal=rawVal/1000;
      unit="lb";
      grams=displayVal*453.592;
    } else if(unitByte===0x03){
      // ml: raw/10 (1ml water = 1g)
      displayVal=rawVal/10;
      unit="ml";
      grams=displayVal;
    } else if(unitByte===0x04){
      // fl.oz: raw/100
      displayVal=rawVal/100;
      unit="fl.oz";
      grams=displayVal*29.5735;
    } else {
      // grams (0x02): raw/10 (confirmed)
      displayVal=rawVal/10;
      unit="g";
      grams=displayVal;
    }
    if(grams<0||grams>30000) return null;
    console.log("Decoded:",displayVal,unit,"("+grams.toFixed(1)+"g) raw:"+rawVal+" unitByte:0x"+unitByte.toString(16));
    return {displayVal,unit,grams,rawHex};
  }
  const connectScale=async()=>{
    if(!navigator.bluetooth){setScaleError("Web Bluetooth requires Chrome or Edge on Android, Windows, or Mac.");return;}
    setScaleConnecting(true);setScaleError("");
    try{
      const dev=await navigator.bluetooth.requestDevice({
        filters:[
          {name:"Etekcity Nutrition Scale"},
          {namePrefix:"Etekcity"},
          {namePrefix:"ETC"},
        ],
        optionalServices:[SCALE_SVC,"0000fff0-0000-1000-8000-00805f9b34fb",
          "0000fff1-0000-1000-8000-00805f9b34fb",
          "0000fff2-0000-1000-8000-00805f9b34fb"]
      });
      setScaleDevice(dev);
      dev.addEventListener("gattserverdisconnected",()=>{setScaleDevice(null);setScaleWeight(null);setScaleError("Scale disconnected.");});
      const server=await dev.gatt.connect();
      const svc=await server.getPrimaryService(SCALE_SVC);
      // Subscribe to weight notifications on FFF1
      const notifyChr=await svc.getCharacteristic(SCALE_CHR_NOTIFY);
      await notifyChr.startNotifications();
      notifyChr.addEventListener("characteristicvaluechanged",(e)=>{
        const d=decodeScaleWt(e.target.value);
        if(d){setScaleRawBytes(d.rawHex||"");if(d.grams>=0){setScaleWeight(d.displayVal);setScaleUnit(d.unit||"g");setScaleWeightGrams(d.grams);}}
      });
      // Store write characteristic for tare command
      try{
        const writeChr=await svc.getCharacteristic(SCALE_CHR_WRITE);
        dev._writeChr=writeChr;
      }catch(e){console.log("Write chr not available:",e.message);}
    }catch(err){
      if(err.name==="NotFoundError") setScaleError("No scale found. Make sure the Etekcity scale is on and nearby.");
      else setScaleError("Could not connect: "+err.message);
    }
    setScaleConnecting(false);
  };
  const disconnectScale=()=>{
    if(scaleDevice?.gatt?.connected) scaleDevice.gatt.disconnect();
    setScaleDevice(null);setScaleWeight(null);setScaleCalcResult(null);
    setScaleFoodName("");setScaleError("");
  };
  const calcScaleNutrition=async()=>{
    if(!scaleFoodName.trim()||!scaleWeight) return;
    setScaleCalcLoading(true);setScaleCalcResult(null);
    try{
      const raw=await callClaude({
        system:"Nutrition AI. Return ONLY valid JSON: {calories,protein_g,carbs_g,fat_g,sat_fat_g,sugar_g,fiber_g,sodium_mg,notes}. Numbers only, no units.",
        prompt:"Estimate nutrition for "+(scaleUnit==="ml"||scaleUnit==="fl.oz"?scaleWeightGrams.toFixed(1)+"g ("+scaleWeight+scaleUnit+")":scaleWeight+scaleUnit)+" of "+scaleFoodName.trim()+". Return JSON only.",
        maxTokens:200,
      });
      if(!raw){setScaleError("No response from nutrition AI. Try again.");setScaleCalcLoading(false);return;}
      const text=typeof raw==="string"?raw:Array.isArray(raw?.content)?raw.content.map(b=>b.text||"").join(""):raw?.content?.[0]?.text||"";
      if(!text.trim()){setScaleError("Empty response. Try again.");setScaleCalcLoading(false);return;}
      const clean=text.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{"),e=clean.lastIndexOf("}");
      let parsed;try{parsed=JSON.parse(clean.slice(s,e+1));}catch(pe){setScaleError("Could not parse nutrition response.");setScaleCalcLoading(false);return;}setScaleCalcResult(parsed);const activeP=familyProfiles.find(p=>p.guidedPlateMode)||familyProfiles[0];const wwBudget=activeP?.wwPointsBudget;const wwPts=wwBudget?Math.max(0,Math.round(((parsed.calories||0)*0.0305)+((parsed.sat_fat_g||0)*0.275)+((parsed.sugar_g||0)*0.12)-((parsed.protein_g||0)*0.098))):null;logNutrition({memberName:activeP?.name||null,itemName:scaleFoodName.trim(),weightG:scaleWeightGrams,calories:parsed.calories,protein_g:parsed.protein_g,carbs_g:parsed.carbs_g,fat_g:parsed.fat_g,sat_fat_g:parsed.sat_fat_g,sugar_g:parsed.sugar_g,fiber_g:parsed.fiber_g,sodium_mg:parsed.sodium_mg,wwPoints:wwPts,source:"scale",});
    }catch(err){setScaleError("Could not estimate nutrition.");}
    setScaleCalcLoading(false);
  };

  // -- Plate History Helper --------------------------------------------------
  const savePlateHistory=(mealName,components)=>{
    try{
      const key="sk_plateHistory";
      const existing=JSON.parse(localStorage.getItem(key)||"{}");
      existing[mealName.toLowerCase().trim()]={
        components:components.map(c=>({name:c.name,category:c.category||"other",suggestedOz:c.weightG?Math.round(c.weightG/28.35*10)/10:null})),
        ts:Date.now()
      };
      localStorage.setItem(key,JSON.stringify(existing));
    }catch{}
  };
  const getPlateHistory=(mealName)=>{
    try{
      const existing=JSON.parse(localStorage.getItem("sk_plateHistory")||"{}");
      return existing[mealName.toLowerCase().trim()]||null;
    }catch{return null;}
  };
  const buildComponentsFromDay=async(day)=>{
    // Layer 1: check history first
    const history=getPlateHistory(day.meal);
    if(history?.components?.length>0){
      return history.components.map(c=>({...c,editable:true,fromHistory:true}));
    }
    // Layer 2: parse from day object fields
    const components=[];
    const mealLower=(day.meal||"").toLowerCase();
    const proteinLower=(day.proteinUsed||"").toLowerCase();
    // Detect if the meal name implies the protein is cooked INTO a sauce/dish
    // e.g. "Spaghetti with Meat Sauce" - Ground Beef is IN the sauce, not a standalone component
    const mealAbsorbsProtein=
      /\b(sauce|stew|soup|chili|curry|casserole|stir.?fry|hash|bowl|burger|meatball|meatloaf|taco|burrito|sandwich|wrap|stuffed|bake|pie|skillet|one.?pot)\b/.test(mealLower)||
      (proteinLower&&mealLower.includes(proteinLower));
    // Only add protein as standalone if it is not absorbed into the dish
    if(day.proteinUsed&&!mealAbsorbsProtein){
      components.push({name:day.proteinUsed,category:"protein",suggestedOz:null,editable:true});
    }
    if(day.ingredients&&day.ingredients.length>0){
      // Flatten comma-separated ingredient strings into individual items
      const flatIngredients=day.ingredients.flatMap(ing=>
        (ing||"").includes(",")?ing.split(",").map(s=>s.trim()).filter(Boolean):[ing]
      );
      flatIngredients.forEach(ing=>{
        const ingLower=(ing||"").toLowerCase();
        // Skip raw protein ingredient if it is already represented in the meal name or a sauce
        const ingIsRawProtein=proteinLower&&(
          ingLower.includes(proteinLower)||
          proteinLower.includes(ingLower.split(" ")[0])
        );
        if(ingIsRawProtein&&mealAbsorbsProtein) return;
        if(ingIsRawProtein&&!mealAbsorbsProtein) return;// already added above
        const isStarch=/\b(pasta|rice|potato|bread|noodle|spaghetti|penne|linguine|fettuccine|angel.?hair|macaroni|quinoa|couscous|barley|tortilla|roll|bun|orzo|ramen|udon)\b/.test(ingLower);
        const isVeg=/\b(broccoli|carrot|bean|pea|spinach|kale|salad|lettuce|tomato|pepper|onion|zucchini|asparagus|corn|celery|cucumber|mushroom|cauliflower|vegetable|veg|green.?bean|brussels)\b/.test(ingLower);
        const isSauce=/\b(sauce|gravy|dressing|soup|broth|cream|butter|oil|ragout|ragu|curry|salsa|pesto|marinara|alfredo|hollandaise)\b/.test(ingLower);
        const isSauceWithProtein=isSauce&&proteinLower&&(
          ingLower.includes("meat")||ingLower.includes("beef")||ingLower.includes("chicken")||
          ingLower.includes("pork")||ingLower.includes("turkey")||ingLower.includes("lamb")||
          ingLower.includes(proteinLower.split(" ")[0])
        );
        // A sauce-with-protein IS the protein component - add as protein category
        if(isSauceWithProtein){
          components.unshift({name:ing,category:"protein",suggestedOz:null,editable:true});
        } else if(isStarch){
          const starchPos=components.findIndex(c=>c.category==="protein")+1||1;
          components.splice(starchPos,0,{name:ing,category:"starch",suggestedOz:null,editable:true});
        } else if(isVeg){
          components.push({name:ing,category:"vegetable",suggestedOz:null,editable:true});
        } else if(isSauce){
          const saucePos=components.findIndex(c=>c.category==="starch")+1||components.length;
          components.splice(saucePos,0,{name:ing,category:"sauce",suggestedOz:null,editable:true});
        }
      });
    }
    if(day.sideUsed&&!components.find(c=>c.name.toLowerCase().includes(day.sideUsed.toLowerCase()))){
      const starchPos=components.findIndex(c=>c.category==="protein")+1||1;
      components.splice(starchPos,0,{name:day.sideUsed,category:"starch",suggestedOz:null,editable:true});
    }
    // Layer 3: if we have a decent list return it, else ask Claude
    if(components.length>=2) return components;
    // Fallback: ask Claude to suggest components
    try{
      const raw=await callClaude({
        system:"Meal component AI. Return ONLY valid JSON array. No markdown.",
        prompt:"List the main plate components for: "+day.meal+". Return JSON array of objects: [{name,category}] where category is one of: protein, starch, vegetable, sauce, other. Order: protein first, then starch, then vegetables. Max 5 components. Simple ingredient names only.",
        maxTokens:200
      });
      const text=typeof raw==="string"?raw:raw?.content?.[0]?.text||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("[");const e=clean.lastIndexOf("]");
      if(s!==-1&&e!==-1){
        const parsed=JSON.parse(clean.slice(s,e+1));
        return parsed.map(p=>({name:p.name||"",category:p.category||"other",suggestedOz:null,editable:true}));
      }
    }catch{}
    return components.length>0?components:[{name:"",category:"protein",suggestedOz:null,editable:true}];
  };

  // -- Nutrition Log Helper --------------------------------------------------
  const logNutrition=async(entry)=>{
    if(!user?.id) return;
    try{
      await supabase.from("nutrition_log").insert([{
        user_id:user.id,
        member_name:entry.memberName||null,
        item_name:entry.itemName,
        weight_g:entry.weightG||null,
        calories:entry.calories||null,
        protein_g:entry.protein_g||null,
        carbs_g:entry.carbs_g||null,
        fat_g:entry.fat_g||null,
        sat_fat_g:entry.sat_fat_g||null,
        sugar_g:entry.sugar_g||null,
        fiber_g:entry.fiber_g||null,
        sodium_mg:entry.sodium_mg||null,
        ww_points:entry.wwPoints||null,
        source:entry.source||"scale",
        session_id:entry.sessionId||null,
        logged_at:entry.loggedAt||new Date().toISOString(),
      }]);
    }catch(e){console.warn("Nutrition log write failed:",e);}
  };

  // -- Grocery Delivery (Instacart / Shipt) ---------------------------------
  const sendToDelivery=async()=>{
    if(!shopping.length){alert("Generate a shopping list first.");return;}
    setInstacartLoading(true);
    if(deliveryService==="shipt"){
      // Shipt deep link — search first item
      const term=encodeURIComponent(shopping[0]?.name||"groceries");
      window.open("https://www.shipt.com/search?q="+term,"_blank");
      setInstacartLoading(false);
      return;
    }
    // Instacart
    try{
      const r=await fetch("/api/send-to-instacart",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          items:shopping.filter(i=>!i.checked),
          apiKey:instacartApiKey||"",
          title:"Smart Kitchen — "+new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})
        })
      });
      const d=await r.json();
      if(d.url){
        window.open(d.url,"_blank");
      } else {
        alert("Could not connect to Instacart. Please try again.");
      }
    }catch(e){
      // Direct fallback
      const terms=shopping.slice(0,8).map(i=>encodeURIComponent(i.name||"")).filter(Boolean).join("+");
      window.open("https://www.instacart.com/store/"+instacartStore+"/search?q="+terms,"_blank");
    }
    setInstacartLoading(false);
  };


  // -- Recipe Share System ------------------------------------------------
  const shareRecipes=async()=>{
    const recipes=Object.values(shareSelected);
    if(!recipes.length){alert("Select at least one recipe to share.");return;}
    setShareLoading(true);
    try{
      const r=await fetch("/api/share-recipes",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          recipes,
          title:shareTitle||"My Recipe Collection",
          ownerName:familyProfiles[0]?.name||"Smart Kitchen",
          ownerUserId:user?.id||null,
        })
      });
      const d=await r.json();
      if(d.success){
        setShareResult({...d,shareCode:d.code,shareUrl:d.url});
      } else {
        alert("Could not create share link: "+(d.error||"Please try again."));
      }
    }catch(e){
      alert("Could not share recipes: "+e.message);
    }
    setShareLoading(false);
  };

  const importSharedRecipes=async()=>{
    const code=importCode.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
    if(code.length<6){alert("Please enter a valid share code.");return;}
    setImportLoading(true);
    setImportResult(null);
    try{
      const r=await fetch("/api/get-shared-recipes?code="+code);
      const d=await r.json();
      if(d.success&&d.share){
        // Normalize to match modal property names
        setImportResult({
          title: d.share.title||"Shared Recipes",
          ownerName: d.share.owner_name||"A Smart Kitchen user",
          recipeCount: d.share.recipe_count||0,
          recipes: Array.isArray(d.share.recipes)?d.share.recipes:[],
          owner_name: d.share.owner_name,
          recipe_count: d.share.recipe_count,
        });
      } else {
        alert(d.error||"Recipe collection not found.");
      }
    }catch(e){
      alert("Could not fetch recipes: "+e.message);
    }
    setImportLoading(false);
  };

  const confirmImport=(recipes)=>{
    // Add to saved recipes (recipeRatings) and family recipes
    const savedToAdd=recipes.filter(r=>!r.isFamilyRecipe);
    const familyToAdd=recipes.filter(r=>r.isFamilyRecipe);
    if(savedToAdd.length){
      setRecipeRatings(prev=>{
        const next={...prev};
        savedToAdd.forEach(r=>{
          if(!next[r.name]) next[r.name]={rating:r.rating||3,recipe:r};
        });
        return next;
      });
    }
    if(familyToAdd.length){
      setFamilyRecipes(prev=>{
        const next=[...prev];
        familyToAdd.forEach(r=>{
          if(!next.find(fr=>fr.name===r.name)) next.push({...r,id:Date.now()+Math.random()});
        });
        return next;
      });
    }
    const total=recipes.length;
    setShowImportModal(false);
    setImportCode("");
    setImportResult(null);
    alert(total+" recipe"+(total>1?"s":"")+" added to your Smart Kitchen!");
  };

  const planOccasionMeal=async()=>{
    if(!occasionState.eventType){
      alert("Please select an occasion type first.");
      return;
    }
    setOccasionLoading(true);
    setOccasionStep("loading");
    const occCtx=buildOccasionContext(occasionState)+(occasionCustomText?" Special occasion name: "+occasionCustomText+".":"");
    const fs=familySummary();
    const invList=inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ");
    const headCount=occasionState.headCount||activeProfiles.length||4;
    const ev=OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType);
    const au=OCCASION_AUDIENCE_TYPES.find(a=>a.key===occasionState.audienceType);
    try{
      // Proteins first — that's what drives the meal decision
      const proteinItems=inventory.filter(i=>{
        const cat=(i.category||"").toLowerCase();
        const name=(i.name||"").toLowerCase();
        return cat.includes("protein")||cat.includes("meat")||cat.includes("poultry")||
               cat.includes("fish")||cat.includes("seafood")||cat.includes("wild harvest")||
               name.includes("chicken")||name.includes("beef")||name.includes("pork")||
               name.includes("steak")||name.includes("salmon")||name.includes("shrimp")||
               name.includes("turkey")||name.includes("lamb")||name.includes("sausage")||
               name.includes("ground")||name.includes("roast")||name.includes("chop");
      }).map(i=>i.name).filter(Boolean);
      // Key produce and dairy — short list
      const otherItems=inventory.filter(i=>{
        const cat=(i.category||"").toLowerCase();
        return cat.includes("produce")||cat.includes("dairy")||cat.includes("home harvest");
      }).slice(0,15).map(i=>i.name).filter(Boolean);
      const invSummary=(proteinItems.length?"Proteins on hand: "+proteinItems.join(", ")+". ":"No proteins on hand — shopping required. ")+
                       (otherItems.length?"Also have: "+otherItems.join(", ")+". ":"");
      // Pull Smart Cellar inventory for "Use What I Have" + drink pairings
      let cellarSummary="";
      if(occasionState.mode==="use"&&occasionState.includeDrinks&&user?.id){
        try{
          const {data:cdata}=await supabase.from("profiles").select("sc_cloud_data").eq("id",user.id).single();
          if(cdata?.sc_cloud_data){
            const parsed=typeof cdata.sc_cloud_data==="string"?JSON.parse(cdata.sc_cloud_data):cdata.sc_cloud_data;
            const bottles=(parsed.cellar||[]).filter(b=>(b.remaining_pct??100)>5);
            if(bottles.length>0){
              cellarSummary="Cellar/bar inventory: "+bottles.map(b=>b.name+(b.type?" ("+b.type+")":"")).join(", ")+". Pick drinkPairings ONLY from this list.";
            }
          }
        }catch(e){/* cellar unavailable - use open pairings */}
      }
      const raw=await callClaude({
        system:"Meal planning AI. Return ONLY valid JSON — no markdown, no backticks. Return a single object with these keys: meal(string), description(string, max 2 sentences), time(string like 45 min), servings(number), makeAheadTips(string or null), shoppingNeeded(array of strings, item names only — max 5 items), drinkPairings(string or null — only populate if drink pairings requested, otherwise null, max 2 sentences with 2-3 specific pairings). No other keys. Keep response under 400 tokens.",
        prompt:occCtx+"Plan ONE special occasion meal for "+headCount+" people. "+(occasionState.mode==="use"?"Use proteins already on hand. "+invSummary+"shoppingNeeded = only missing items, max 5. ":"SURPRISE ME — be creative and unexpected. Do NOT use Pork Spareribs, pork ribs, or any protein already common in the household. Pick something the family would not normally make. Budget: "+(occasionState.budget||"flexible")+". Do NOT list any inventory — shop for everything needed. shoppingNeeded may include all ingredients. ")+(fs?"Dietary rules: "+fs+". ":"")+(occasionState.guestRestrictions?"Guest needs: "+occasionState.guestRestrictions+". ":"")+(occasionState.note?"Request: "+occasionState.note+". ":"")+(cellarSummary?"\n\n"+cellarSummary:""),
        maxTokens:400,
      });
      const text=typeof raw==="string"?raw:raw?.content?.[0]?.text||"";
      if(!text||!text.includes("{")) throw new Error("Empty response: "+text.slice(0,80));
      const clean=text.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{"),e=clean.lastIndexOf("}");
      if(s===-1||e===-1) throw new Error("No JSON found");
      const parsed=JSON.parse(clean.slice(s,e+1));
      if(!parsed.meal) throw new Error("Missing meal field");
      // Normalize shoppingNeeded to array of {name,qty,unit}
      parsed.shoppingNeeded=(parsed.shoppingNeeded||[]).map(n=>typeof n==="string"?{name:n,qty:1,unit:""}:n);
      setOccasionResult(parsed);
      setOccasionStep("result");
    }catch(err){
      console.error("planOccasionMeal error:",err);
      alert("Could not generate occasion meal: "+err.message.slice(0,80)+". Please try again.");
      setOccasionStep("form");
    }
    setOccasionLoading(false);
  };

  const scheduleOccasionMeal=()=>{
    if(!occasionDate||!occasionResult) return;
    const chosen=new Date(occasionDate+"T12:00:00");
    const today=new Date();
    // Find Monday of current meal plan week
    const daysToMon=today.getDay()===0?1:8-today.getDay();
    const monday=new Date(today);
    monday.setDate(today.getDate()+daysToMon-7);// start of current week
    const sunday=new Date(monday);
    sunday.setDate(monday.getDate()+6);
    const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const chosenDay=dayNames[chosen.getDay()];
    // Check if chosen date falls in current meal plan week
    const inCurrentWeek=chosen>=monday&&chosen<=sunday;
    if(inCurrentWeek&&mealPlan.length>0){
      const dayIdx=mealPlan.findIndex(d=>d.day===chosenDay);
      if(dayIdx>=0){
        const newDay={
          ...mealPlan[dayIdx],
          meal:occasionResult.meal,
          proteinUsed:occasionResult.proteinUsed||null,
          ingredients:occasionResult.ingredients||[],
          shoppingNeeded:(occasionResult.shoppingNeeded||[]).map(n=>typeof n==="string"?{qty:1,unit:"",name:n}:n),
          needToBuy:occasionResult.shoppingNeeded||[],
          isOccasion:true,
          occasionLabel:OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType)?.label||"Occasion",
        };
        setMealPlan(p=>p.map((d,i)=>i===dayIdx?newDay:d));
        alert("Meal plan updated! "+chosenDay+"'s dinner is now "+occasionResult.meal+".");
        setShowOccasionPlanner(false);
        setOccasionStep("form");
        setOccasionResult(null);
        setOccasionDate("");
        setTab("mealplan");
        return;
      }
    }
    // Outside current week — push to Google Calendar
    const dateStr=occasionDate.replace(/-/g,"");
    const desc="Occasion: "+(OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType)?.label||"")+
      " | Meal: "+occasionResult.meal+
      (occasionResult.shoppingNeeded?.length>0?" | Need to buy: "+occasionResult.shoppingNeeded.map(s=>s.name||s).join(", "):"");
    const calUrl="https://calendar.google.com/calendar/render?action=TEMPLATE"+
      "&text="+encodeURIComponent("Special Dinner: "+occasionResult.meal)+
      "&dates="+dateStr+"/"+dateStr+
      "&details="+encodeURIComponent(desc);
    window.open(calUrl,"_blank");
    alert("Added to Google Calendar for "+chosenDay+", "+new Date(occasionDate+"T12:00:00").toLocaleDateString()+"!");
    setShowOccasionPlanner(false);
    setOccasionStep("form");
    setOccasionResult(null);
    setOccasionDate("");
  };

  // Deep link: ?import=CODE auto-opens recipe import modal
  useEffect(()=>{
    const _p=new URLSearchParams(window.location.search);
    const _c=_p.get("import");
    if(_c&&_c.length>=4){
      setTimeout(()=>{
        setImportCode(_c.toUpperCase().replace(/[^A-Z0-9]/g,""));
        setShowImportModal(true);
        window.history.replaceState({},"",window.location.pathname);
      },700);
    }
  },[]);

  // Handle ?accept=CODE from manager/viewer invite email link
  useEffect(()=>{
    const _ap=new URLSearchParams(window.location.search);
    const _ac=_ap.get("accept");
    if(_ac&&_ac.length>=6&&user){
      setAcceptCode(_ac.toUpperCase().replace(/[^A-Z0-9]/g,""));
      setTimeout(()=>{
        const url=new URL(window.location.href);
        url.searchParams.delete("accept");
        window.history.replaceState({},"",url.toString());
      },500);
    }
  },[user]);

  // Auto-accept invite when acceptCode and user are both ready
  useEffect(()=>{
    if(!acceptCode||!user||acceptSending)return;
    const doAccept=async()=>{
      setAcceptSending(true);
      try{
        const res=await fetch("/api/manage-invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"accept",invite_code:acceptCode,invitee_uid:user.id,invitee_email:user.email,invitee_name:user.user_metadata?.full_name||""})});
        const d=await res.json();
        if(d.success){
          if(d.role==="manager"){setIsManager(true);setManagerOwnerUid(d.owner_uid);alert("You are now a Manager on "+(d.owner_name||"this")+" account. You can edit their meal plan and inventory.");}
          else{alert("You are now a Viewer on "+(d.owner_name||"this")+" account. You can view their meal plan and inventory.");}
        }else{
          alert("Could not accept invitation: "+(d.error||"Unknown error"));
        }
      }catch(e){
        alert("Error accepting invitation. Please try again.");
      }
      setAcceptCode("");
      setAcceptSending(false);
    };
    doAccept();
  },[acceptCode,user]);

  // Manager role loaded via account_roles table in main.jsx



  // VOICE ENGINE START
  const speak=(text)=>{
    if(!window.speechSynthesis)return;
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    utt.rate=0.95;utt.pitch=1.05;utt.volume=1;
    const gender=localStorage.getItem("sk_voiceGender")||"female";
    const savedVoiceName=localStorage.getItem("sk_voiceName")||"";
    // Apply pitch/rate for tone regardless of voice availability
    if(gender==="male"){utt.pitch=0.75;utt.rate=0.88;}else{utt.pitch=1.15;utt.rate=0.97;}
    const assignVoiceAndSpeak=()=>{
      const voices=window.speechSynthesis.getVoices();
      const enVoices=voices.filter(v=>v.lang&&v.lang.startsWith("en"));
      // Try saved voice name first (user-selected accent)
      const byName=savedVoiceName?enVoices.find(v=>v.name===savedVoiceName):null;
      const picked=byName||enVoices.find(v=>v.lang==="en-US")||enVoices[0]||voices[0];
      if(picked)utt.voice=picked;
      utt.onstart=()=>setVoiceState("speaking");
      utt.onend=()=>setVoiceState("idle");
      setVoiceResponse(text);
      window.speechSynthesis.speak(utt);
    };
    const voices=window.speechSynthesis.getVoices();
    if(voices&&voices.length>0){assignVoiceAndSpeak();}
    else{window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;assignVoiceAndSpeak();};}
  };
  const handleVoiceCommand=async(transcript)=>{
    const t=transcript.toLowerCase().trim();
    const days=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const todayIdx=new Date().getDay();
    const dayMap={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
    const mealDays=mealPlan||[];
    setVoiceState("processing");
    const findDay=(str)=>{
      for(const d of days){if(str.includes(d))return dayMap[d];}
      if(str.includes("today")||str.includes("tonight"))return todayIdx;
      if(str.includes("tomorrow"))return(todayIdx+1)%7;
      return -1;
    };
    if(t.match(/what.*(for dinner|on.*menu|cooking|planned)/)){
      const di=findDay(t);
      if(di>=0&&mealDays[di]){const day=mealDays[di];speak(day.meal?"Tonight's dinner is "+day.meal+"."+(day.quickMeal?" It's a quick meal for a busy night.":""):"No meal planned for that day yet.");}
      else if(mealDays.length>0){const today=mealDays[todayIdx%mealDays.length];speak(today&&today.meal?"Tonight's dinner is "+today.meal+".":"No meal planned for tonight.");}
      else speak("You don't have a meal plan yet. Tap Build Meal Plan to get started.");
      return;
    }
    if(t.match(/what.*(meal plan|whole week|this week|all week)/)){
      if(mealDays.length===0){speak("You don't have a meal plan yet.");return;}
      speak("Here's your week. "+mealDays.map(d=>d.day+": "+d.meal).join(". "));
      return;
    }
    if(t.match(/shopping list|what.*need.*buy/)){
      const list=JSON.parse(localStorage.getItem("sk_shoppingList")||"[]");
      if(!list||list.length===0){speak("Your shopping list is empty.");return;}
      speak("You have "+list.length+" items on your shopping list. "+list.slice(0,8).map(i=>i.name||i).join(", ")+(list.length>8?" and more.":"."));
      return;
    }
    if(t.match(/is .* on.*list|do.*need|on.*shopping list/)){
      const list=JSON.parse(localStorage.getItem("sk_shoppingList")||"[]");
      const query=t.replace(/is |on.*list|do.*need|my |the /g,"").trim();
      const found=list.filter(i=>(i.name||i).toLowerCase().includes(query));
      speak(found.length>0?"Yes, "+found.map(i=>i.name||i).join(" and ")+" is on your shopping list.":"I don't see "+query+" on your shopping list.");
      return;
    }
    if(t.match(/how many|how much|do i have any|do i have|do you have any/)){
      const query=t.replace(/how many|how much|do i have any|do i have|do you have any|any|some|the|my|\?/g,"").trim();
      if(!query){speak("What item would you like me to check?");return;}
      const matches=inventory.filter(i=>i.name&&i.name.toLowerCase().includes(query));
      if(matches.length===0)speak("I don't see any "+query+" in your inventory.");
      else speak("You have "+matches.map(i=>i.quantity+" "+(i.unit||"")+" of "+i.name+(i.location?" in the "+i.location:"")).join(". And ")+".");
      return;
    }
    if(t.match(/what (meat|protein|produce|dairy|frozen|pantry|freezer|fridge).*(have|in)/)){
      const catMap={meat:"Protein",protein:"Protein",produce:"Produce",dairy:"Dairy",frozen:"Frozen",freezer:"Freezer",fridge:"Fridge",pantry:"Pantry"};
      const cat=Object.keys(catMap).find(k=>t.includes(k));
      if(cat){
        const items=inventory.filter(i=>(i.category||i.location||"").toLowerCase().includes(catMap[cat].toLowerCase()));
        speak(items.length===0?"I don't see anything in "+catMap[cat]+" right now.":"In your "+catMap[cat]+" you have: "+items.map(i=>i.name).slice(0,6).join(", ")+(items.length>6?" and more":"")+"."); 
      }
      return;
    }
    if(t.match(/^add |^adding /)){
      const item=t.replace(/^add(ing)?/,"").replace(/to (my )?(inventory|pantry|fridge|freezer)/,"").trim();
      if(!item){speak("What would you like to add?");return;}
      let qty=1,name=item;
      const numMatch=item.match(/^(\d+)\s+(.+)/);
      if(numMatch){qty=parseInt(numMatch[1]);name=numMatch[2];}
      const locMatch=t.match(/(fridge|freezer|pantry)/);
      const loc=locMatch?locMatch[1].charAt(0).toUpperCase()+locMatch[1].slice(1):"Pantry";
      setInventory(prev=>[...prev,{id:Date.now(),name:name.charAt(0).toUpperCase()+name.slice(1),quantity:qty,unit:"item",category:"Pantry",location:loc,addedDate:new Date().toISOString().split("T")[0]}]);
      speak("Added "+qty+" "+name+" to your "+loc+". Got it.");
      return;
    }
    if(t.match(/make this|how do i make|how to make|steps for/)){
      const mealName=t.replace(/make this|how do i make|how to make|steps for/,"").trim()||(mealDays[todayIdx%Math.max(mealDays.length,1)]&&mealDays[todayIdx%Math.max(mealDays.length,1)].meal)||lastSuggestedMeal;
      if(!mealName){speak("Which meal would you like instructions for?");return;}
      try{
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system:"You are a cooking assistant. Give 4-6 short step-by-step instructions for the requested meal. Keep each step under 15 words. Speak naturally as if reading aloud.",messages:[{role:"user",content:"Cooking steps for: "+mealName}]})});
        const d=await res.json();
        speak("Here's how to make "+mealName+". "+(d.content&&d.content[0]?d.content[0].text:"I couldn't get those steps right now."));
      }catch(e){speak("I had trouble getting those steps. Try tapping the recipe card.");}
      return;
    }
    if(t.match(/give me a recipe|suggest a recipe|recipe for|what can i make with/)){
      const dish=t.replace(/give me a recipe for|suggest a recipe for|recipe for|what can i make with/,"").trim()||"something delicious";
      try{
        const invSummary=inventory.slice(0,20).map(i=>i.quantity+" "+i.name).join(", ");
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:"You are "+assistantName()+", a friendly Smart Kitchen voice assistant. Suggest one recipe in 3-4 sentences. Name the dish, key ingredients, and cooking time. Keep it conversational for voice reading.",messages:[{role:"user",content:"Suggest a recipe for "+dish+". Inventory: "+invSummary}]})});
        const d=await res.json();
        const text=d.content&&d.content[0]?d.content[0].text:"How about a simple pasta dish tonight?";
        const mealMatch=text.match(/^([A-Z][^.!?]{3,40})/);
        if(mealMatch)setLastSuggestedMeal(mealMatch[1].trim());
        speak(text);
      }catch(e){speak("I had trouble thinking of a recipe. Try asking me again.");}
      return;
    }
    if(t.match(/add.*to.*plan|add.*to (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|put.*on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)){
      const di=findDay(t);
      const meal=t.replace(/add|put|to (my |the )?meal plan|to (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,"").trim();
      const mealName=meal||lastSuggestedMeal;
      if(!mealName){speak("What meal would you like to add?");return;}
      if(di<0){speak("Which day would you like to add "+mealName+" to?");return;}
      const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      setMealPlan(prev=>{const updated=[...prev];const idx=updated.findIndex(d=>d.day===dayNames[di]);if(idx>=0)updated[idx]={...updated[idx],meal:mealName.charAt(0).toUpperCase()+mealName.slice(1)};return updated;});
      speak("Done! Added "+mealName+" to "+dayNames[di]+".");
      return;
    }
    // Route everything else through the unified chat assistant
    setChatOpen(true);
    await sendChatMessage(transcript,true);
    setVoiceState("idle");  };
  const startListening=()=>{
    const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRec){alert("Voice input requires Chrome on Android or desktop.");return;}
    window.speechSynthesis&&window.speechSynthesis.cancel();
    const rec=new SpeechRec();
    voiceRecRef.current=rec;
    rec.lang="en-US";rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
    setVoiceState("listening");setVoiceTranscript("");setVoiceResponse("");setShowVoicePanel(true);
    rec.onresult=(e)=>{const t=e.results[0][0].transcript;setVoiceTranscript(t);handleVoiceCommand(t);};
    rec.onerror=(e)=>{setVoiceState("idle");if(e.error==="not-allowed")speak("Microphone access was blocked. Please allow mic access in your browser settings.");};
    rec.onend=()=>{};
    rec.start();
  };
  const stopListening=()=>{voiceRecRef.current&&voiceRecRef.current.stop();window.speechSynthesis&&window.speechSynthesis.cancel();setVoiceState("idle");};
  // VOICE ENGINE END

  const buildMealPlan=async()=>{
    const occCtx=buildOccasionContext(occasionState)+(occasionCustomText?" Special occasion name: "+occasionCustomText+"":"");
    if(!can.sevenDayPlan){
      setUpgradeModal({feature:"7-Day Meal Planning",desc:"Get a personalized 7-day dinner plan built around your proteins and pantry.",icon:"📅"});
      return;
    }
    setLoading(true); setLoadMsg("Building meal plan…"); setTab("mealplan");
    try{
      const proteins=proteinItems.map(i=>i.name+" "+i.qty+" portions").join(", ");
      const fs=familySummary();
      const raw=await callClaude({
        system:"Return ONLY a JSON array of 7 dinner plan objects. No other text. Start with [ end with ]. Each: {day,meal,proteinUsed,sauteBagsUsed,sideUsed,shoppingNeeded}. day is Monday through Sunday. proteinUsed is string or null. sauteBagsUsed is number. sideUsed is string or null. shoppingNeeded is array of {name,qty,unit} — ONLY items NOT in the inventory list.",
        prompt:(()=>{const wh=inventory.filter(i=>i.category==="Wild Harvest").map(i=>i.name+" ("+i.qty+" "+i.unit+")").join(", ");const hh=inventory.filter(i=>i.category==="Home Harvest").map(i=>i.name+" ("+i.qty+" "+i.unit+")").join(", ");const lv=inventory.filter(i=>i.isLeftover&&i.qty>0).map(i=>i.name+" "+i.qty+" servings (use by "+i.useBy+")").join(", ");const prefS=buildPreferenceSummary();return"Proteins available: "+proteins+". Saute blend: "+(blendItem?.qty||0)+" bags."+(wh?" Wild Harvest inventory (treat as premium proteins, species-aware cooking): "+wh+".":"")+(hh?" Home Harvest produce/eggs/livestock: "+hh+" — prioritize fresh produce nearing end of shelf life.":"")+(lv?" LEFTOVER MEALS AVAILABLE (prioritize for Busy Nights, use before expiry): "+lv+".":"")+" Full inventory on hand (DO NOT put these in shoppingNeeded): "+inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")+". "+fs+(()=>{if(!can.medicalCompliance)return "";const strictMembers=activeProfiles.filter(p=>p.enforcement==="strict"&&((p.medications||[]).length>0||(p.medicalAllergies||[]).length>0||p.medicalPlan));if(!strictMembers.length)return "";return "STRICT MEDICAL ENFORCEMENT: "+strictMembers.map(p=>{const parts=[];const allAllergies=[...(p.medicalAllergies||[])];if(p.medicalAllergiesCustom)allAllergies.push(p.medicalAllergiesCustom);if(allAllergies.length)parts.push("NEVER include "+allAllergies.join(", ")+" for "+p.name);if(p.medications?.some(m=>["warfarin","coumadin"].some(d=>m.name?.toLowerCase().includes(d))))parts.push("NO grapefruit, minimize high-vitamin-K greens for "+(p.name||"member"));if(p.medications?.some(m=>["rosuvastatin","atorvastatin","lovastatin","simvastatin"].some(d=>m.name?.toLowerCase().includes(d))))parts.push("NO grapefruit for "+(p.name||"member"));return parts.join("; ");}).filter(Boolean).join(" | ")+" — these are HARD STOPS, do not suggest any meal containing these items. ";})()+(()=>{if(!can.medicalCompliance)return "";const warnMembers=activeProfiles.filter(p=>p.enforcement==="warn"&&(p.medicalAllergies||[]).length>0);if(!warnMembers.length)return "";return "WARN members have preferences but may include flagged items — AI should still try to avoid known conflict ingredients where possible. ";})()+prefS+occCtx+"Plan 7 dinners Mon-Sun using proteins and inventory above. Max 3 chicken meals. At least 1 beef. At least 1 pork or kielbasa. No same protein two days in a row. CRITICAL ROTATION RULE: Maximum 3 meals may come from the 5-star keeper list — the other 4 or more meals MUST be creative new suggestions the family has not had recently. Variety and discovery are essential. If Wild Harvest proteins are present, include at least 1 wild game or fish meal. If Home Harvest produce is present, feature it prominently. If leftovers are available, schedule at least 1 leftover meal as a Busy Night option. shoppingNeeded must ONLY list items not found in the inventory list above."+(()=>{const now=new Date();const month=now.getMonth();const season=month>=2&&month<=4?"Spring":month>=5&&month<=7?"Summer":month>=8&&month<=10?"Fall":"Winter";const holiday=month===11?"Christmas":month===10?"Thanksgiving":month===3?"Easter":month===6?"Fourth of July":null;const eligible=familyRecipes.filter(r=>r.rotation&&(r.frequency==="weekly"||(r.frequency==="4week")||(r.frequency==="seasonal"&&((r.seasons||[]).includes("\u2744 Winter")&&season==="Winter"||(r.seasons||[]).includes("\u2600 Summer")&&season==="Summer"||(r.seasons||[]).includes("\ud83c\udf38 Spring")&&season==="Spring"||(r.seasons||[]).includes("\ud83c\udf42 Fall")&&season==="Fall"||(holiday&&(r.seasons||[]).some(s=>s.includes(holiday)))))));return eligible.length>0?" FAMILY RECIPES available for rotation (include 1-2 if ingredients are on hand): "+eligible.map(r=>r.name+(r.ingredients&&r.ingredients.length>0?" (needs: "+r.ingredients.slice(0,4).join(", ")+")":"")).join("; ")+".":"";})();})(),
        maxTokens:3000,
      });
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s===-1||e===-1) throw new Error("No plan returned");
      setMealPlan(JSON.parse(raw.slice(s,e+1)));
    } catch(err){ alert("Could not build meal plan: "+err.message); }
    setLoading(false);
  };

  const quickMealForDay=async(dayIdx)=>{
    if(!can.busyNightFlag){
      setUpgradeModal({feature:"Busy Night Flag",desc:"Tap ⚡ Busy? on any night and get a quick dinner under 20 minutes — perfect for sports nights and hectic evenings.",icon:"⚡"});
      return;
    }
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
  const madeMeal=(day)=>{if(!day)return;setMadeItDay(day);setMadeItSides([]);setMadeItSideInput("");setMadeItSubs({});setShowMadeItModal(true);};  const confirmMadeIt=(day,sides,subs)=>{if(!day)return;try{const h=JSON.parse(localStorage.getItem("sk_madeItHistory")||"[]");h.push({meal:day.meal,protein:day.proteinUsed||null,day:day.day,sides:sides||[],substitutions:subs||{},isLeftover:day.isLeftover||false,isBusyNight:day.busyNight||false,ts:Date.now()});localStorage.setItem("sk_madeItHistory",JSON.stringify(h.slice(-100)));}catch{}setInventory(prev=>prev.map(item=>{const nameLower=item.name.toLowerCase();if(day.proteinUsed&&nameLower.includes(day.proteinUsed.toLowerCase())&&item.isBulkProtein)return{...item,qty:Math.max(0,item.qty-1)};if((day.sauteBagsUsed||0)>0&&item.vegType==="sauteBlend")return{...item,qty:Math.max(0,item.qty-(day.sauteBagsUsed||0))};if(sides&&sides.some(s=>nameLower.includes(s.toLowerCase())))return{...item,qty:Math.max(0,item.qty-1)};if(subs){const subVals=Object.values(subs).map(v=>v.toLowerCase());if(subVals.some(v=>nameLower.includes(v)))return{...item,qty:Math.max(0,item.qty-1)};}return item;}));if(user?.id&&day.meal){const activeP=familyProfiles.find(p=>p.guidedPlateMode)||familyProfiles[0];logNutrition({memberName:activeP?.name||null,itemName:day.meal+(sides&&sides.length>0?" with "+sides.join(", "):""),weightG:null,calories:null,protein_g:null,carbs_g:null,fat_g:null,sat_fat_g:null,sugar_g:null,fiber_g:null,sodium_mg:null,wwPoints:null,source:"made_it",sessionId:Date.now().toString()});}setShowMadeItModal(false);setMadeItDay(null);};
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
      const fs=familySummary();
      const invList=inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ");
      const raw=await callClaude({
        system:"Return ONLY a JSON array of 3 dessert recipes. No other text. Start with [ end with ]. Each object: {id(number),name(string),time(string),difficulty(Easy|Medium|Hard),category(Baked|No-Bake|Quick-Treat),description(one sentence),steps(array of 3 short strings),servings(number),usesFromInventory(array of ingredient names from inventory),missingIngredients(array of items NOT in inventory)}."+(fs?" CRITICAL DIETARY RULES — HARD STOPS: "+fs:""),
        prompt:"Full pantry/fridge inventory: "+invList+". Suggest 3 easy desserts using what's on hand. Prefer ingredients already in inventory. missingIngredients must ONLY list items NOT in the inventory above."+(fs?" ENFORCE these dietary rules: "+fs:""),
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
    const isHarvestProtein=(newItem.category==="Wild Harvest"||newItem.category==="Home Harvest")&&newItem.harvestType==="Protein";
    const item={...newItem,id:Date.now(),qty:parseFloat(newItem.qty)};
    if(isProtein){item.isBulkProtein=true;if(!newItem.location||newItem.location==="Pantry")item.location="Freezer";if(!item.unit)item.unit="portions";if(!item.portionOz)item.portionOz=6;}
    if(isHarvestProtein){item.isBulkProtein=true;if(!item.unit)item.unit="lbs";if(!item.portionOz)item.portionOz=6;}
    setInventory(p=>[...p,item]);
    setNewItem({name:"",qty:"",unit:"",category:"Pantry",location:"Pantry",harvestType:""});
    setShowAdd(false);
  };

  // -- Print helpers ----------------------------------------------------------
  const printMealPlan=()=>setPrintModal("mealplan");
  const printShopping=()=>setPrintModal("shopping");
  const printRecipeCard=(recipe,photo)=>{
    const css="@page{margin:2cm;size:portrait;}body{font-family:Georgia,serif;padding:40px 48px;color:#111;margin:0;background:#fff;}.title{font-size:30px;font-weight:700;color:#1A2344;margin:0 0 6px 0;line-height:1.2;border-bottom:3px solid #C8963E;padding-bottom:12px;margin-bottom:16px;}.meta{display:flex;gap:12px;font-size:13px;color:#555;margin-bottom:16px;flex-wrap:wrap;}.meta span{background:#f5f5f5;border:1px solid #ddd;border-radius:20px;padding:3px 12px;}.photo{width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-bottom:16px;border:1px solid #ddd;}.section{margin-bottom:18px;}.section-title{font-size:13px;font-weight:700;color:#1A2344;text-transform:uppercase;letter-spacing:1px;border-bottom:1px dashed #ddd;padding-bottom:5px;margin-bottom:10px;}.ingredient{font-size:14px;color:#222;padding:4px 0;border-bottom:1px dotted #eee;}.step{font-size:14px;color:#222;margin-bottom:10px;display:flex;gap:10px;line-height:1.6;}.step-num{font-size:15px;font-weight:700;color:#C8963E;flex-shrink:0;min-width:20px;}.footer{border-top:1px solid #ddd;padding-top:10px;margin-top:20px;display:flex;justify-content:space-between;font-size:11px;color:#aaa;}@media print{body{background:white;padding:0;}}";
    const photoHtml=photo?"<img class='photo' src='"+photo+"'/>":"";
    const ings=(recipe.ingredients||[]).filter(i=>i&&i.trim()).map(i=>"<div class='ingredient'>&#8226; "+i+"</div>").join("");
    const steps=(recipe.instructions||recipe.steps||[]).filter(s=>s&&s.trim()).map((s,i)=>"<div class='step'><span class='step-num'>"+(i+1)+".</span><span>"+s+"</span></div>").join("");
    const meta="<span>&#9201; "+(recipe.time||"~30 min")+"</span><span>"+(recipe.difficulty||"")+"</span>";
    const html="<!DOCTYPE html><html><head><title>"+recipe.name+"</title><meta charset='utf-8'/><style>"+css+"</style></head><body>"
      +"<div class='title'>"+recipe.name+"</div>"
      +"<div class='meta'>"+meta+"</div>"
      +photoHtml
      +(ings?"<div class='section'><div class='section-title'>Ingredients</div>"+ings+"</div>":"")
      +(steps?"<div class='section'><div class='section-title'>Instructions</div>"+steps+"</div>":"")
      +"<div class='footer'><span>Smart Kitchen&#8482;</span><span>smart-kitchen-opal.vercel.app</span></div>"
      +"</body></html>";
    const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if(isMobile){
      const blob=new Blob([html],{type:"text/html"});
      const url=URL.createObjectURL(blob);
      const iframe=document.createElement("iframe");
      iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;background:white;";
      iframe.src=url;
      document.body.appendChild(iframe);
      iframe.onload=()=>{setTimeout(()=>{iframe.contentWindow.print();setTimeout(()=>{document.body.removeChild(iframe);URL.revokeObjectURL(url);},1000);},400);};
    } else {
      const w=window.open("","_blank","width=750,height=950");
      w.document.write(html);
      w.document.close();w.focus();setTimeout(()=>{w.print();w.close();},600);
    }
  };

  // -- Push to Google Calendar ------------------------------------------------
  const pushToCalendar=async()=>{
    if(!mealPlan.length) return;
    try{
      const today=new Date();
      const daysToMon=today.getDay()===0?1:8-today.getDay();
      const monday=new Date(today);
      monday.setDate(today.getDate()+daysToMon);
      const offsets={Monday:0,Tuesday:1,Wednesday:2,Thursday:3,Friday:4,Saturday:5,Sunday:6};
      const urls=mealPlan.map(day=>{
        const d=new Date(monday);
        d.setDate(monday.getDate()+(offsets[day.day]??0));
        const dateStr=d.toISOString().split("T")[0].replace(/-/g,"");
        const desc=[
          day.proteinUsed?"Protein: "+day.proteinUsed:"",
          (day.sauteBagsUsed||0)>0?"Saute blend: "+day.sauteBagsUsed+" bag":"",
          day.sideUsed?"Side: "+day.sideUsed:"",
          (day.shoppingNeeded||[]).length>0?"Need: "+day.shoppingNeeded.map(s=>s.name).join(", "):"All on hand",
        ].filter(Boolean).join(" | ");
        return "https://calendar.google.com/calendar/render?action=TEMPLATE"+
          "&text="+encodeURIComponent("Dinner: "+day.meal)+
          "&dates="+dateStr+"/"+dateStr+
          "&details="+encodeURIComponent(desc);
      });
      const w=window.open(urls[0],"_blank");
      if(!w){alert("Please allow popups for this site, then tap Calendar again.");return;}
      if(urls.length>1){
        setTimeout(()=>{
          if(window.confirm("Dinner 1 of "+urls.length+" opened in Google Calendar.\n\nClick OK to open the next dinner, or Cancel to stop.")){
            let i=1;
            const openNext=()=>{
              if(i>=urls.length){alert("✅ All "+urls.length+" dinners sent to Google Calendar!");return;}
              window.open(urls[i],"_blank");
              i++;
              if(i<urls.length) setTimeout(()=>{
                if(window.confirm("Dinner "+i+" of "+urls.length+" opened.\n\nClick OK to continue.")){openNext();}
              },800);
              else setTimeout(()=>alert("✅ All "+urls.length+" dinners sent to Google Calendar!"),800);
            };
            openNext();
          }
        },1500);
      } else {
        setTimeout(()=>alert("✅ Dinner added to Google Calendar!"),800);
      }
    } catch(e){ alert("Calendar push failed: "+e.message); }
  };

  const filtered=[...inventory.filter(i=>(filterCat==="All"||(i.category===filterCat)||(i.harvestType===filterCat&&(i.category==="Wild Harvest"||i.category==="Home Harvest")))&&(filterLoc==="All"||i.location===filterLoc)&&(invSearch===""||i.name.toLowerCase().includes(invSearch.toLowerCase())))].sort((a,b)=>invSort==="category"?(a.category||"").localeCompare(b.category||"")||a.name.localeCompare(b.name):a.name.localeCompare(b.name));

  // -- Render -----------------------------------------------------------------
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:FB}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>

  
      {showJoinViewer&&user&&(<JoinAsViewerModal user={user} onClose={()=>setShowJoinViewer(false)} onJoined={()=>{setShowJoinViewer(false);window.location.reload();}}/>)}
{showSettings&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowSettings(false)}><div style={{background:C.card,borderRadius:16,padding:28,width:340,maxWidth:"90vw",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>Settings</div><div style={{fontSize:11,color:C.muted,fontFamily:FM,marginBottom:20}}>Smart Kitchen v1.5</div><div style={{marginTop:12,background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:"#1A2344",marginBottom:8}}>🎙 Voice Assistant Name</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:6}}>What should your assistant be called? (default: Cathy)</div><input placeholder="e.g. Cathy, Alex, Rosie..." defaultValue={localStorage.getItem("sk_assistantName")||"Cathy"} onChange={e=>localStorage.setItem("sk_assistantName",e.target.value||"Cathy")} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:FM,fontSize:12,marginBottom:6,boxSizing:"border-box"}}/><div style={{fontSize:11,color:C.muted,fontFamily:FM,marginBottom:10}}>Tap the 🎙 Hey [Name] button in the menu to activate voice.</div><div style={{fontFamily:FD,fontSize:13,fontWeight:600,color:C.text,marginBottom:6}}>Assistant Voice</div><VoicePicker/><button onClick={()=>{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const utt=new SpeechSynthesisUtterance("Hi, I'm "+(localStorage.getItem("sk_assistantName")||"Cathy")+". I'm your Smart Kitchen assistant. What's for dinner tonight?");utt.rate=0.95;utt.pitch=1.05;const gender=localStorage.getItem("sk_voiceGender")||"female";const femaleNames=["Samantha","Karen","Victoria","Moira","Fiona","Tessa","Veena","Zira","Google US English Female","Microsoft Zira"];const maleNames=["Tom","Daniel","Alex","Fred","Google US English Male","Microsoft David","Microsoft Mark"];if(gender==="male"){utt.pitch=0.7;utt.rate=0.88;}else{utt.pitch=1.15;utt.rate=0.95;}const doSpeak=()=>{const voices=window.speechSynthesis.getVoices();const enVoices=voices.filter(v=>v.lang&&v.lang.startsWith("en"));const femaleN=["Samantha","Karen","Victoria","Moira","Fiona","Tessa","Veena","Zira","Google US English Female","Microsoft Zira"];const maleN=["Tom","Daniel","Alex","Fred","Google US English Male","Microsoft David","Microsoft Mark"];const namedMatch=enVoices.find(v=>gender==="female"?femaleN.some(n=>v.name.toLowerCase().includes(n.toLowerCase())):maleN.some(n=>v.name.toLowerCase().includes(n.toLowerCase())));const picked=namedMatch||enVoices.find(v=>v.localService)||enVoices[0]||voices[0];if(picked)utt.voice=picked;window.speechSynthesis.speak(utt);};const pVoices=window.speechSynthesis.getVoices();if(pVoices&&pVoices.length>0){doSpeak();}else{window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;doSpeak();};}}} style={{...bBtn("ghost"),width:"100%",fontSize:11,border:"1px solid "+C.border,color:C.muted,marginBottom:8}}>🔊 Preview Voice</button><button onClick={()=>{const loadAndShow=()=>{const v=window.speechSynthesis.getVoices();if(!v||v.length===0){alert("No voices loaded yet. Try again in a moment.");return;}const list=v.filter(x=>x.lang.startsWith("en")).map(x=>x.name+" ("+x.lang+(x.localService?" local":" remote")+")").join("\n");alert("Available English voices ("+v.filter(x=>x.lang.startsWith("en")).length+" of "+v.length+" total):\n\n"+list);};const v=window.speechSynthesis.getVoices();if(v&&v.length>0){loadAndShow();}else{window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;loadAndShow();};}}} style={{...bBtn("ghost"),width:"100%",fontSize:11,border:"1px solid "+C.border,color:C.muted,marginBottom:16}}>🔍 Show Available Voices</button><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>Shopping Partner</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:6}}>Who gets the emailed shopping list?</div><input placeholder="Name (e.g. Lisa)" value={shopPartnerName} onChange={e=>{setShopPartnerName(e.target.value);localStorage.setItem("sk_shopPartnerName",e.target.value);}} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:FM,fontSize:12,marginBottom:6,boxSizing:"border-box"}}/><input placeholder="Email address" value={shopPartnerEmail} onChange={e=>{setShopPartnerEmail(e.target.value);localStorage.setItem("sk_shopPartnerEmail",e.target.value);}} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:FM,fontSize:12,boxSizing:"border-box"}}/><div style={{fontSize:11,color:C.muted,fontFamily:FM,margin:"10px 0 4px"}}>Phone for SMS shopping list</div><input placeholder="e.g. 616-555-1234" type="tel" value={shopPhone} onChange={e=>{setShopPhone(e.target.value);localStorage.setItem("sk_shopPhone",e.target.value);}} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:FM,fontSize:12,boxSizing:"border-box"}}/><div style={{fontSize:10,color:C.muted,fontFamily:FM,marginTop:3}}>US numbers only.</div><div style={{background:"#22c55e"+"12",border:"1px solid "+"#22c55e"+"33",borderRadius:8,padding:"10px 12px",marginTop:8}}><div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:4}}>📱 On mobile — works instantly</div><div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.5}}>Tap "Text to..." and your shopping list opens in your Messages app, ready to send.</div></div><div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"10px 12px",marginTop:6}}><div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:C.text,marginBottom:4}}>🖥 On desktop — two options</div><div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:6}}><strong style={{color:C.text}}>Option 1 (free):</strong> Tap "Text to..." and choose your messaging app from the picker — the list is pre-filled.</div><div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:8}}><strong style={{color:C.text}}>Option 2 (background send):</strong> Connect Twilio to send SMS silently without any app picker.</div><button onClick={()=>setShowSmsHelp(true)} style={{background:"transparent",border:"1px solid "+C.accent,borderRadius:6,color:C.accent,fontFamily:FM,fontSize:11,cursor:"pointer",padding:"5px 10px",fontWeight:600}}>Set Up Twilio (background SMS)</button></div></div><div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{darkMode?"🌙 Dark Mode":"☀ Light Mode"}</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:10}}>Switch between dark and light display themes.</div><button style={{...bBtn("ghost"),width:"100%",border:"1px solid "+C.border,color:C.text}} onClick={()=>setDarkMode(m=>!m)}>{darkMode?"Switch to Light Mode ☀":"Switch to Dark Mode 🌙"}</button></div><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>Recipe Search Site</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:10}}>Where to search for recipes when you tap a meal name.</div><div style={{display:"flex",flexDirection:"column",gap:6}}>{[["google","🔍 Google Recipes"],["allrecipes","🍳 AllRecipes"],["pinterest","📌 Pinterest"],["foodnetwork","📺 Food Network"]].map(([key,label])=>(<button key={key} onClick={()=>{setRecipeSite(key);localStorage.setItem("sk_recipeSite",key);}} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+(recipeSite===key?C.accent:C.border),background:recipeSite===key?C.accent+"22":"transparent",color:recipeSite===key?C.accent:C.text,fontFamily:FM,fontSize:12,cursor:"pointer",textAlign:"left"}}>{label}{recipeSite===key?" ✓":""}</button>))}</div></div><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>Grocery Delivery</div><div style={{fontSize:11,color:C.muted,fontFamily:FM,marginBottom:10}}>Send your shopping list to a delivery service.</div><div style={{display:"flex",gap:6,marginBottom:10}}>{[["instacart","Instacart"],["shipt","Shipt"]].map(([k,label])=>(<button key={k} onClick={()=>{setDeliveryService(k);localStorage.setItem("sk_deliveryService",k);}} style={{flex:1,padding:"7px",borderRadius:8,border:"1px solid "+(deliveryService===k?"#00873A":C.border),background:deliveryService===k?"#00873A22":"transparent",color:deliveryService===k?"#00873A":C.text,fontFamily:FM,fontSize:11,cursor:"pointer",fontWeight:600}}>{label}{deliveryService===k?" ✓":""}</button>))}</div>{deliveryService==="instacart"&&(<div><div style={{fontFamily:FM,fontSize:11,fontWeight:600,color:C.text,marginBottom:6}}>Preferred Store</div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{[["meijer","Meijer"],["aldi","ALDI"],["kroger","Kroger"],["costco","Costco"],["walmart","Walmart"],["target","Target"]].map(([k,label])=>(<button key={k} onClick={()=>{setInstacartStore(k);localStorage.setItem("sk_instacartStore",k);}} style={{padding:"5px 10px",borderRadius:16,border:"1px solid "+(instacartStore===k?"#00873A":C.border),background:instacartStore===k?"#00873A22":"transparent",color:instacartStore===k?"#00873A":C.text,fontFamily:FM,fontSize:11,cursor:"pointer"}}>{label}{instacartStore===k?" ✓":""}</button>))}</div><div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"10px 12px"}}><div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:3}}>Works now — no setup needed</div><div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.5}}>Tap Send to Instacart and your items open in Instacart ready to shop. One-tap pre-built cart coming when Instacart reopens their developer program.</div></div></div>)}</div><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>🍳 Kitchen Appliances</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:6}}>Smart Kitchen assumes a standard stovetop, oven, and microwave. Add any extras you have — or use the custom field if your setup is different (induction burner, convection microwave, toaster oven, etc.).</div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{KITCHEN_APPLIANCES.map(a=>{const on=kitchenAppliances.includes(a.id);return(<button key={a.id} onClick={()=>setKitchenAppliances(prev=>on?prev.filter(x=>x!==a.id):[...prev,a.id])} style={{padding:"6px 10px",borderRadius:16,border:"1px solid "+(on?C.accent:C.border),background:on?C.accent+"22":"transparent",color:on?C.accent:C.text,fontFamily:FM,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><span>{a.emoji}</span><span>{a.label}</span>{on&&<span style={{color:C.accent,fontWeight:700}}> \u2713</span>}</button>);})}</div>{kitchenAppliances.filter(id=>!KITCHEN_APPLIANCES.some(a=>a.id===id)).map(custom=>(<div key={custom} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:12,background:C.accent+"22",border:"1px solid "+C.accent,color:C.accent,fontFamily:FM,fontSize:10,marginRight:4,marginBottom:4}}><span>🔧 {custom}</span><span style={{cursor:"pointer",fontWeight:700}} onClick={()=>setKitchenAppliances(prev=>prev.filter(x=>x!==custom))}>x</span></div>))}<div style={{display:"flex",gap:6,marginTop:8}}><input value={applianceCustomInput} onChange={e=>setApplianceCustomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&applianceCustomInput.trim()){const val=applianceCustomInput.trim();if(!kitchenAppliances.includes(val))setKitchenAppliances(prev=>[...prev,val]);setApplianceCustomInput("");}}} placeholder="Add custom appliance..." style={{flex:1,background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"5px 8px",color:C.text,fontFamily:FM,fontSize:11,outline:"none"}}/><button onClick={()=>{const val=applianceCustomInput.trim();if(val&&!kitchenAppliances.includes(val)){setKitchenAppliances(prev=>[...prev,val]);setApplianceCustomInput("");}}} style={{...bBtn("primary"),padding:"5px 10px",fontSize:11}}>+ Add</button></div></div><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>Reset Inventory</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:10}}>Clears all inventory items. Keeps profiles, meal plan, and preferences.</div><button style={{...bBtn("ghost"),width:"100%",border:"1px solid "+C.red,color:C.red}} onClick={()=>{if(window.confirm("Clear all inventory? Cannot be undone.")){localStorage.removeItem("sk_inventory");localStorage.removeItem("sk_portionFixV2");setInventory([]);setShowSettings(false);alert("Inventory cleared.");}}}>Clear Inventory</button></div><div style={{background:C.surface,borderRadius:10,padding:16}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>Reset All Data</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:10}}>Wipes everything and restarts the Setup Wizard. Use for demo resets.</div><button style={{...bBtn("ghost"),width:"100%",border:"1px solid "+C.red,color:C.red}} onClick={()=>{if(window.confirm("Reset ALL data? Cannot be undone.")){["sk_inventory","sk_familyProfiles","sk_familySize","sk_mealPlan","sk_sportsNights","sk_recipeSite","sk_seniorMode","sk_setupDone","sk_portionFixV2","sk_installDismissed","sk_reminderDismissed","sk_saleItems","sk_tempProfiles","sk_activeTab","sk_chatWelcomeDone","sk_tourChoice","sk_tourStep","sk_guestCaptured","sk_darkMode","sk_recipes","sk_recipeRatings","sk_desserts","sk_dessertRatings","sk_seenFeature_occasionSystem","sk_seenFeature_smsShoppingList","sk_appliances"].forEach(k=>localStorage.removeItem(k));window.location.reload();}}}>Reset All Data</button></div></div><div style={{background:"#f5f3ff",borderRadius:10,padding:16,marginTop:12}}>
<div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:"#065f46",marginBottom:8}}>Household Members</div>{!isViewer&&!isManager&&user&&(<div style={{marginBottom:12}}><div style={{fontSize:12,color:"#444",fontFamily:FM,marginBottom:10,lineHeight:1.5}}>Invite a caregiver or family member to help manage this account, or share view-only access.</div>{!showInviteManager?(<div style={{display:"flex",flexDirection:"column",gap:6}}><button style={{...bBtn("ghost"),width:"100%",border:"1px solid #059669",color:"#065f46",fontWeight:600}} onClick={()=>setShowInviteManager(true)}>+ Invite Someone</button></div>):(<div style={{background:"#f0fdf4",borderRadius:10,padding:14,border:"1px solid #86efac"}}><div style={{fontFamily:FD,fontSize:13,fontWeight:600,color:"#065f46",marginBottom:10}}>Send an Invitation</div><div style={{fontSize:12,color:"#444",fontFamily:FM,marginBottom:6}}>Their email address</div><input placeholder="caregiver@email.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} style={{width:"100%",background:"#fff",border:"1px solid #86efac",borderRadius:6,padding:"8px 10px",color:"#1a2344",fontFamily:FM,fontSize:13,marginBottom:10,boxSizing:"border-box"}}/><div style={{fontSize:12,color:"#444",fontFamily:FM,marginBottom:6}}>Their role</div><div style={{display:"flex",gap:6,marginBottom:10}}><button onClick={()=>setInviteRole("viewer")} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(inviteRole==="viewer"?"#4a1d96":"#ccc"),background:inviteRole==="viewer"?"#f5f3ff":"#fff",color:inviteRole==="viewer"?"#4a1d96":"#444",fontFamily:FM,fontSize:11,cursor:"pointer",fontWeight:inviteRole==="viewer"?700:400}}>👁 Viewer<br/><span style={{fontSize:10,fontWeight:400}}>Read-only — any plan</span></button><button onClick={()=>setInviteRole("manager")} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(inviteRole==="manager"?"#059669":"#ccc"),background:inviteRole==="manager"?"#f0fdf4":"#fff",color:inviteRole==="manager"?"#065f46":"#444",fontFamily:FM,fontSize:11,cursor:"pointer",fontWeight:inviteRole==="manager"?700:400}}>🩺 Manager<br/><span style={{fontSize:10,fontWeight:400}}>Edit meals — inventory</span></button></div>{inviteRole==="manager"&&can.tier!=="medical"&&(<div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:8,padding:"10px 12px",marginBottom:10}}><div style={{fontSize:12,color:"#c2410c",fontFamily:FM,lineHeight:1.5}}>🔒 Manager access requires Medical+. <button onClick={()=>{setShowInviteManager(false);setShowSettings(false);onUpgrade();}} style={{background:"none",border:"none",color:"#c2410c",fontFamily:FM,fontSize:12,cursor:"pointer",textDecoration:"underline",padding:0}}>Upgrade now</button></div></div>)}{inviteSuccess?(<div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"10px 12px",marginBottom:8}}><div style={{fontSize:12,color:"#065f46",fontFamily:FM}}>{inviteSuccess}</div></div>):null}<div style={{display:"flex",gap:8}}><button style={{...bBtn("ghost"),flex:1,border:"1px solid #ccc",color:"#444"}} onClick={()=>{setShowInviteManager(false);setInviteEmail("");setInviteSuccess("");}}>Cancel</button><button style={{...bBtn("primary"),flex:1}} disabled={inviteSending||!inviteEmail||inviteEmail.indexOf("@")<0||(inviteRole==="manager"&&can.tier!=="medical")} onClick={async()=>{setInviteSending(true);setInviteSuccess("");try{const res=await fetch("/api/manage-invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"send",owner_uid:user.id,owner_name:user.user_metadata?.full_name||user.email,owner_email:user.email,invitee_email:inviteEmail,role:inviteRole})});const d=await res.json();if(d.success){setInviteSuccess("Invitation sent to "+inviteEmail+"! They have 7 days to accept.");setInviteEmail("");}else{setInviteSuccess("Error: "+(d.error||"Could not send invite"));}}catch(e){setInviteSuccess("Error sending invitation. Please try again.");}setInviteSending(false);}}>{inviteSending?"Sending...":"Send Invite"}</button></div></div>)}</div>)}{(isViewer||isManager)&&user&&(<div style={{marginBottom:12}}><div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:12,color:"#065f46",fontFamily:FM,fontWeight:600,marginBottom:4}}>🩺 You have caregiver access to this account</div><div style={{fontSize:11,color:"#444",fontFamily:FM,lineHeight:1.5}}>{isManager?"You can edit the meal plan and inventory to help manage their diet.":"You have read-only access to view the meal plan and inventory."}</div></div></div>)}<div style={{borderTop:"1px solid #e5e7eb",marginBottom:12,paddingTop:12}}><div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:"#4a1d96",marginBottom:4}}>👁 Family Viewer Access</div>
<div style={{fontSize:12,color:"#888",fontFamily:FM,marginBottom:10}}>Set a custom code so family members can view your meal plan and inventory in read-only mode on their own device.</div>
<ViewerCodeManager user={user} isViewer={isViewer} viewerRole={viewerRole}/>
</div>
<div style={{background:"#EEF1F8",borderRadius:10,padding:16,marginTop:12}}>
<div style={{fontFamily:FD,fontSize:14,fontWeight:600,color:"#1A2344",marginBottom:4}}>🌐 Cloud Sync</div>
<div style={{fontSize:12,color:"#888",fontFamily:FM,marginBottom:10}}>Your data syncs automatically every 5 minutes and when you switch apps. Tap to sync now.</div>
{!isViewer&&<button style={{...bBtn("primary"),width:"100%",marginBottom:8}} onClick={async()=>{
  if(!user){alert("Sign in to use cloud sync.");return;}
  const ok=await import("./supabaseClient").then(m=>m.saveCloudData(user.id));
  alert(ok?"Data saved to cloud ✓":"Sync failed — check connection");
}}>Save to Cloud Now</button>}
{!isViewer&&<button style={{...bBtn("ghost"),width:"100%",border:"1px solid #1A2344",color:"#1A2344",marginBottom:8}} onClick={async()=>{
  if(!user){alert("Sign in to use cloud sync.");return;}
  const ok=await import("./supabaseClient").then(m=>m.loadCloudData(user.id));
  if(ok){window.dispatchEvent(new Event("sk_cloud_loaded"));alert("Data loaded from cloud ✓");}
  else alert("Load failed — check connection");
}}>Load from Cloud</button>}
{!isViewer&&<button style={{...bBtn("ghost"),width:"100%",border:"1px solid #b45309",color:"#b45309"}} onClick={async()=>{
  const count=await import("./supabaseClient").then(m=>m.restoreFromBackup());
  if(count>0){window.dispatchEvent(new Event("sk_cloud_loaded"));alert("Restored "+count+" items from backup ✓ Refresh to see changes.");}
  else alert("No backup found.");
}}>Restore from Backup</button>}
{isViewer&&<button style={{...bBtn("primary"),width:"100%"}} onClick={async()=>{
  try{
    const gv=JSON.parse(localStorage.getItem("sk_guest_viewer")||"{}");
    const code=gv.code||"";
    if(!code){alert("No family code found. Try joining again from the welcome screen.");return;}
    const res=await fetch("/api/viewer-data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});
    const result=await res.json();
    if(!result.success){alert(result.error||"Could not refresh. Check connection.");return;}
    const SMAP={inventory:"sk_inventory",family_profiles:"sk_familyProfiles",family_size:"sk_familySize",meal_plan:"sk_mealPlan",family_recipes:"sk_familyRecipes",recipe_ratings:"sk_recipeRatings",dessert_ratings:"sk_dessertRatings",shopping_list:"sk_shoppingList",recipes:"sk_recipes",desserts:"sk_desserts",sports_nights:"sk_sportsNights",recipe_site:"sk_recipeSite",senior_mode:"sk_seniorMode",dark_mode:"sk_darkMode"};
    const d=result.data;
    Object.entries(SMAP).forEach(([k,v])=>{if(d[k]!==null&&d[k]!==undefined){try{if(Array.isArray(d[k])&&d[k].length===0)return;localStorage.setItem(v,typeof d[k]==="object"?JSON.stringify(d[k]):String(d[k]));}catch(e){}}});
    window.dispatchEvent(new Event("sk_cloud_loaded"));
    alert("Updated! ✓");
  }catch(e){alert("Error: "+e.message);}
}}>🔄 Refresh Family Data</button>}
</div>
<button style={{...bBtn("ghost"),width:"100%",marginTop:8,border:"1px solid #7c3aed",color:"#4a1d96"}} onClick={()=>{setShowSettings(false);setShowJoinViewer(true);}}>&#128065; Join as Viewer (enter family code)</button>
</div><button style={{...bBtn("ghost"),width:"100%",marginTop:8}} onClick={()=>setShowSettings(false)}>Close</button></div></div>}
    {showWizard&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.surface,borderRadius:16,padding:28,maxWidth:440,width:"100%",border:"1px solid "+C.border,maxHeight:"90vh",overflowY:"auto"}}>
            {wizardStep===-3&&(<div style={{padding:"8px 0"}}>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontFamily:FD,fontSize:seniorMode?30:22,color:C.accent,marginBottom:6}}>👋 Welcome to Smart Kitchen!</div>
                <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:13,color:C.muted,lineHeight:1.6}}>Create your free account to save your meal plans, inventory, and preferences across any device.</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
                <input
                  placeholder="Your first name"
                  value={wizardSignupName}
                  onChange={e=>setWizardSignupName(e.target.value)}
                  style={{...bInp,fontSize:seniorMode?17:14,padding:seniorMode?"14px 12px":"10px 12px"}}
                />
                <input
                  placeholder="Email address"
                  type="email"
                  value={wizardSignupEmail}
                  onChange={e=>setWizardSignupEmail(e.target.value)}
                  style={{...bInp,fontSize:seniorMode?17:14,padding:seniorMode?"14px 12px":"10px 12px"}}
                />
                <input
                  placeholder="Choose a password (min 6 characters)"
                  type="password"
                  value={wizardSignupPassword}
                  onChange={e=>setWizardSignupPassword(e.target.value)}
                  style={{...bInp,fontSize:seniorMode?17:14,padding:seniorMode?"14px 12px":"10px 12px"}}
                />
              </div>
              {wizardSignupError&&<div style={{fontFamily:"system-ui",fontSize:13,color:C.red,marginBottom:10,textAlign:"center"}}>{wizardSignupError}</div>}
              <button
                style={{...bBtn("primary"),width:"100%",padding:seniorMode?18:14,fontSize:seniorMode?19:15,marginBottom:10,opacity:wizardSignupLoading?0.6:1}}
                onClick={async()=>{
                  setWizardSignupError("");
                  if(!wizardSignupEmail||!wizardSignupEmail.includes("@")){setWizardSignupError("Please enter a valid email address.");return;}
                  if(!wizardSignupPassword||wizardSignupPassword.length<6){setWizardSignupError("Password must be at least 6 characters.");return;}
                  setWizardSignupLoading(true);
                  try{
                    const {error:signUpErr}=await supabase.auth.signUp({email:wizardSignupEmail,password:wizardSignupPassword,options:{data:{full_name:wizardSignupName}}});
                    if(signUpErr){
                      setWizardSignupError(signUpErr.message||"Could not create account. Try a different email.");
                    } else {
                      setWizardStep(-2);
                      // Send welcome email with User Manual + Family Guide attached
                      fetch("/api/send-welcome-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:wizardSignupEmail,name:wizardSignupName,tier:"solo"})}).catch(()=>{});
                    }
                  } catch(e){
                    setWizardSignupError("Connection error. Please try again.");
                  }
                  setWizardSignupLoading(false);
                }}
                disabled={wizardSignupLoading}
              >
                {wizardSignupLoading?"Creating account...":"Create Free Account →"}
              </button>
              <button
                style={{...bBtn("ghost"),width:"100%",padding:seniorMode?14:10,fontSize:seniorMode?16:13,borderColor:"#C8963E",color:"#C8963E"}}
                onClick={()=>setShowEmailGate(true)}
              >
                ✨ Try Free for 30 Days — no credit card required
              </button>
              {onShowGuestViewer&&<button onClick={onShowGuestViewer} style={{background:"transparent",border:"none",color:"#a78bfa",fontFamily:FM,fontSize:seniorMode?15:12,cursor:"pointer",marginTop:4,textDecoration:"underline",display:"block",width:"100%",padding:"8px 0"}}>👁 Have a family code? View their kitchen</button>}
              <div style={{fontFamily:"system-ui",fontSize:seniorMode?14:11,color:C.muted,textAlign:"center",marginTop:10,lineHeight:1.6}}>30-day free trial · No credit card required · Cancel anytime</div>
            </div>)}
            {wizardStep===-2&&(<div style={{textAlign:"center",padding:"8px 0",maxHeight:"70vh",overflowY:"auto"}}>
              <img src="data:image/jpeg;base64,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" alt="Smart Kitchen" style={{width:"200px",height:"auto",marginBottom:16,borderRadius:20,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}/>
              <div style={{fontFamily:FD,fontSize:seniorMode?34:24,color:C.accent,marginBottom:8}}>Welcome to Smart Kitchen</div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:11,color:C.muted,fontStyle:"italic",marginBottom:12,lineHeight:1.8,textAlign:"center"}}>Most apps are created by developers for users.<br/>Smart Kitchen™ was created by a user, for users.</div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?19:14,color:C.text,lineHeight:1.7,marginBottom:20}}>Your personal AI-powered kitchen assistant — designed to help your family eat well, waste less, and spend smarter.</div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24,textAlign:"left"}}>
                {[
                  ["📦","Inventory","Scan receipts and shelves to track what you have on hand"],
                  ["🍽","Meal Planning","Get a personalized 7-day dinner plan based on your proteins and pantry"],
                  ["🔍","Recipes","AI-suggested recipes with step-by-step instructions"],
                  ["🏷","Sale Shopping","Scan weekly ads to build budget meal plans around what's on sale"],
                ].map(([icon,title,desc])=>(
                  <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start",background:C.card,borderRadius:10,padding:"10px 12px"}}>
                    <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
                    <div>
                      <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?18:13,fontWeight:700,color:C.accent,marginBottom:2}}>{title}</div>
                      <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:12,color:C.muted,lineHeight:1.5}}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>Setup takes about 2 minutes. You can always update your preferences later.</div>
              <button style={{...bBtn("primary"),width:"100%",padding:seniorMode?18:14,fontSize:seniorMode?19:15}} onClick={()=>setWizardStep(-1)}>
                Let's Get Started →
              </button>
            </div>)}
            {wizardStep===-1&&(<div style={{padding:"4px 0"}}>
              <div style={{fontFamily:FD,fontSize:seniorMode?30:22,color:C.accent,marginBottom:4,textAlign:"center"}}>Here's what we'll set up</div>
              <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?17:13,color:C.muted,marginBottom:18,textAlign:"center",lineHeight:1.6}}>Just 3 quick steps — takes about 2 minutes.</div>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start",background:C.card,borderRadius:12,padding:"14px"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👨‍👩‍👧</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?19:14,fontWeight:700,color:C.text,marginBottom:4}}>1. Family Profile</div>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:12,color:C.muted,lineHeight:1.6}}>Tell us who you're cooking for and any dietary or medical needs — <strong style={{color:C.text}}>diabetic-friendly, low sodium, gluten-free</strong>, and more. Smart Kitchen will <strong style={{color:"#22c55e"}}>automatically enforce these in every recipe and meal plan.</strong></div>
                  </div>
                </div>
                <div style={{display:"flex",gap:14,alignItems:"flex-start",background:C.card,borderRadius:12,padding:"14px"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📦</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?19:14,fontWeight:700,color:C.text,marginBottom:4}}>2. Your Inventory</div>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:12,color:C.muted,lineHeight:1.6}}>We'll quickly add proteins, pantry staples, and what you already have on hand — scan or type, whichever is easier.</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:14,alignItems:"flex-start",background:C.card,borderRadius:12,padding:"14px"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🍽</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?19:14,fontWeight:700,color:C.text,marginBottom:4}}>3. Meal Preferences</div>
                    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:12,color:C.muted,lineHeight:1.6}}>How your family likes to eat — quick weeknight meals, busy sports nights, favorite cuisines, and more.</div>
                  </div>
                </div>
              </div>
              <div style={{background:"#1a2e1a",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:16}}>💡</span>
                <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:seniorMode?16:12,color:"#86efac",lineHeight:1.5}}>You can always update any of these later from the app settings.</div>
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
                {tier==="medical"?(
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <input type="number" min="1" value={familySize} onChange={e=>{const n=Math.max(1,parseInt(e.target.value)||1);setFamilySize(n);setFamilyProfiles(p=>{const base=p.length>=n?p:p.concat(Array.from({length:n-p.length},(_,i)=>({id:p.length+i+1,name:"",role:"adult",restriction:"standard",customParams:{},active:true})));return base.map((pr,i)=>({...pr,active:i<n}));});}} style={{width:70,padding:"6px 10px",borderRadius:8,border:"1px solid "+C.accent,background:C.card,color:C.text,fontFamily:FM,fontSize:16,fontWeight:700}}/>
                    <span style={{fontSize:12,color:C.muted,fontFamily:FM}}>family members (Medical+ - no limit)</span>
                  </div>
                ):(
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {(tier==="solo"?[1]:tier==="family"?[2,3,4,5,6]:[1,2,3,4,5,6,7,8]).map(n=>(
                      <button key={n} onClick={()=>{setFamilySize(n);setFamilyProfiles(p=>p.map((pr,i)=>({...pr,active:i<n})));}}
                        style={{width:38,height:38,borderRadius:8,border:"1px solid "+(familySize===n?C.accent:C.border),background:familySize===n?C.accent+"22":"transparent",color:familySize===n?C.accent:C.muted,cursor:tier==="solo"?"not-allowed":"pointer",fontFamily:FM,fontSize:14,fontWeight:600}}>
                        {n}
                      </button>
                    ))}
                    {tier==="solo"&&<span style={{fontSize:11,color:C.muted,fontFamily:FM,alignSelf:"center",marginLeft:4}}>Solo plan - 1 member</span>}
                  </div>
                )}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:9,maxHeight:280,overflowY:"auto",marginBottom:14}}>
                {familyProfiles.filter(p=>p.active).map((profile,idx)=>{
                  const preset=RESTRICTION_PRESETS[profile.restriction]||RESTRICTION_PRESETS.standard;
                  return(
                    <div key={profile.id} style={{background:C.card,borderRadius:12,padding:14}}>
                      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                        <div style={{fontSize:18}}>{preset.icon}</div>
                        <input style={{...bInp,flex:1}} placeholder={"Family member "+(idx+1)+" name"} value={profile.name}
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
              <div style={{fontFamily:FD,fontSize:seniorMode?28:20,color:C.accent,marginBottom:6}}>🔍 Recipe Search</div>
              <div style={{fontFamily:FM,fontSize:seniorMode?16:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>When you tap a meal name, which site opens for the full recipe?</div>
              {[["google","🔍 Google Recipes"],["allrecipes","🍳 AllRecipes"],["pinterest","📌 Pinterest"],["foodnetwork","📺 Food Network"]].map(([key,label])=>(
                <div key={key} onClick={()=>setRecipeSite(key)} style={{padding:seniorMode?"16px":"12px 16px",borderRadius:10,marginBottom:8,cursor:"pointer",border:"2px solid "+(recipeSite===key?C.accent:C.border),background:recipeSite===key?C.accent+"11":C.card,fontFamily:FM,fontSize:seniorMode?17:13,color:recipeSite===key?C.accent:C.text}}>{label}</div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(0)}>← Back</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>setWizardStep(2)}>Next →</button>
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
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(1)}>← Back</button>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(3)}>Skip</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>setWizardStep(3)}>Next →</button>
              </div>
            </div>)}
            {wizardStep===3&&(<div>
              <div style={{fontFamily:FD,fontSize:seniorMode?28:20,color:C.accent,marginBottom:6}}>📦 Inventory Setup</div>
              <div style={{fontFamily:FM,fontSize:seniorMode?16:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>How do you want to start your pantry inventory?</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button style={{...bBtn('primary'),padding:seniorMode?'20px':'16px',textAlign:'left'}} onClick={()=>{setPantryChecklist(COMMON_PANTRY.map(i=>({...i,checked:true})));setWizardStep(4);}}>
                  <div style={{fontFamily:FD,fontSize:seniorMode?18:14}}>✅ Start with common pantry items</div>
                  <div style={{fontFamily:FM,fontSize:seniorMode?15:12,color:C.muted,marginTop:4}}>We'll pre-check ~30 staples — just uncheck what you don't have</div>
                </button>
                <button style={{...bBtn('ghost'),padding:seniorMode?'20px':'16px',textAlign:'left'}} onClick={()=>{setPantryChecklist(COMMON_PANTRY.map(i=>({...i,checked:false})));setWizardStep(4);}}>
                  <div style={{fontFamily:FD,fontSize:seniorMode?18:14}}>🔲 Start from scratch</div>
                  <div style={{fontFamily:FM,fontSize:seniorMode?15:12,color:C.muted,marginTop:4}}>Manually check off what you have</div>
                </button>
                <button style={{...bBtn('ghost'),padding:seniorMode?'20px':'16px',textAlign:'left'}} onClick={()=>completeWizard()}>
                  <div style={{fontFamily:FD,fontSize:seniorMode?18:14}}>⏭ Skip for now</div>
                  <div style={{fontFamily:FM,fontSize:seniorMode?15:12,color:C.muted,marginTop:4}}>Go straight to the app — you can add inventory anytime</div>
                </button>
              </div>
              <div style={{display:'flex',gap:8,marginTop:16}}>
                <button style={{...bBtn('ghost'),flex:1}} onClick={()=>setWizardStep(2)}>← Back</button>
              </div>
            </div>)}
            {wizardStep===4&&(<div>
              <div style={{fontFamily:FD,fontSize:seniorMode?28:20,color:C.accent,marginBottom:6}}>🧺 Pantry Checklist</div>
              <div style={{fontFamily:FM,fontSize:seniorMode?16:13,color:C.muted,marginBottom:12,lineHeight:1.6}}>Check off what you have on hand:</div>
              <div style={{maxHeight:320,overflowY:'auto',marginBottom:12}}>
                {pantryChecklist.map((item,idx)=>(
                  <div key={idx} style={{display:'flex',alignItems:'center',gap:10,padding:seniorMode?'12px 4px':'8px 4px',borderBottom:'1px solid '+C.border}}>
                    <input type='checkbox' checked={item.checked} onChange={e=>{const updated=[...pantryChecklist];updated[idx]={...updated[idx],checked:e.target.checked};setPantryChecklist(updated);}} style={{width:seniorMode?24:18,height:seniorMode?24:18,cursor:'pointer'}}/>
                    <span style={{fontFamily:FM,fontSize:seniorMode?18:14,color:C.text}}>{item.name}</span>
                    <span style={{fontFamily:FM,fontSize:seniorMode?14:11,color:C.muted,marginLeft:'auto'}}>{item.category}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button style={{...bBtn('ghost'),flex:1}} onClick={()=>setWizardStep(3)}>← Back</button>
                <button style={{...bBtn('primary'),flex:2}} onClick={()=>{const checked=pantryChecklist.filter(i=>i.checked).map(i=>i.name);if(checked.length>0){const newItems=checked.map(name=>({id:Date.now()+Math.random(),name,quantity:1,unit:'item',category:pantryChecklist.find(p=>p.name===name)?.category||'Pantry',addedDate:new Date().toISOString().split('T')[0]}));setInventory(prev=>[...prev,...newItems.filter(ni=>!prev.some(p=>p.name===ni.name))]);}setWizardStep(5);}}>🎉 Next → Kitchen Setup ({pantryChecklist.filter(i=>i.checked).length} items)</button>
              </div>
            </div>)}
            {wizardStep===5&&(<div>
              <div style={{fontFamily:FD,fontSize:seniorMode?28:20,color:C.accent,marginBottom:6}}>🍳 Your Kitchen Setup</div>
              <div style={{fontFamily:FM,fontSize:seniorMode?15:12,color:C.muted,marginBottom:12,lineHeight:1.6}}>Smart Kitchen assumes a standard kitchen by default. Tell us what you actually have — especially if your setup is different.</div>
              <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
                <div style={{fontFamily:FM,fontSize:10,color:C.muted,letterSpacing:0.8,marginBottom:8}}>ASSUMED BY DEFAULT (always available)</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {[{e:"🍳",l:"Stovetop / Range"},{e:"🏠",l:"Conventional Oven"},{e:"🌡",l:"Microwave"}].map(item=>(
                    <div key={item.l} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:14,background:C.surface,border:"1px solid "+C.border,fontFamily:FM,fontSize:11,color:C.muted}}>
                      <span>{item.e}</span><span>{item.l}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:FM,fontSize:10,color:C.muted,marginTop:8,lineHeight:1.5}}>No stovetop or oven? Add your actual setup below using the custom field — e.g. <em>Induction Burner</em>, <em>Convection Microwave</em>, <em>Toaster Oven</em>.</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {KITCHEN_APPLIANCES.map(a=>{const on=kitchenAppliances.includes(a.id);return(<button key={a.id} onClick={()=>setKitchenAppliances(prev=>on?prev.filter(x=>x!==a.id):[...prev,a.id])} style={{padding:"8px 12px",borderRadius:20,border:"2px solid "+(on?C.accent:C.border),background:on?C.accent+"22":"transparent",color:on?C.accent:C.text,fontFamily:FM,fontSize:seniorMode?14:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><span>{a.emoji}</span><span>{a.label}</span>{on&&<span style={{color:C.accent,fontWeight:700}}> \u2713</span>}</button>);})}
              </div>
              <div style={{fontFamily:FM,fontSize:seniorMode?14:12,color:C.text,fontWeight:600,marginBottom:6}}>Don\u2019t see yours? Add it:</div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <input value={applianceCustomInput} onChange={e=>setApplianceCustomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&applianceCustomInput.trim()){const val=applianceCustomInput.trim();if(!kitchenAppliances.includes(val))setKitchenAppliances(prev=>[...prev,val]);setApplianceCustomInput("");}}} placeholder="e.g. Ninja Woodfire, Ooni, Wok..." style={{flex:1,background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"8px 12px",color:C.text,fontFamily:FM,fontSize:12,outline:"none"}}/>
                <button onClick={()=>{const val=applianceCustomInput.trim();if(val&&!kitchenAppliances.includes(val)){setKitchenAppliances(prev=>[...prev,val]);setApplianceCustomInput("");}}} style={{...bBtn("primary"),padding:"8px 14px",fontSize:12}}>+ Add</button>
              </div>
              {kitchenAppliances.filter(id=>!KITCHEN_APPLIANCES.some(a=>a.id===id)).map(custom=>(<div key={custom} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:16,background:C.accent+"22",border:"1px solid "+C.accent,color:C.accent,fontFamily:FM,fontSize:11,marginRight:6,marginBottom:6}}><span>🔧 {custom}</span><span style={{cursor:"pointer",fontSize:13,fontWeight:700}} onClick={()=>setKitchenAppliances(prev=>prev.filter(x=>x!==custom))}>x</span></div>))}
              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setWizardStep(4)}>← Back</button>
                <button style={{...bBtn("ghost"),flex:1}} onClick={()=>completeWizard()}>Skip</button>
                <button style={{...bBtn("primary"),flex:2}} onClick={()=>completeWizard()}>🎉 Done</button>
              </div>
            </div>)}
            
          </div>
        </div>
      )}
      {showInstallBanner&&(<div style={{background:C.surface,borderBottom:"2px solid "+C.accent,padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>📱</span><div style={{flex:1,minWidth:0}}><div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.accent}}>Install Smart Kitchen on your phone</div><div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:1}}>{/iPhone|iPad|iPod/.test(navigator.userAgent)?"Tap Share then Add to Home Screen":"Tap menu then Add to Home Screen"}</div></div><button onClick={dismissInstall} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:8,color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:11,padding:"5px 10px",flexShrink:0}}>Got it</button></div>)}
      {isViewer&&<div style={{background:"#4a1d96",color:"#e9d5ff",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"2px solid #7c3aed"}}><span style={{fontSize:14,fontFamily:"Arial,sans-serif"}}>👁 Viewing {viewerRole?.label||"Family"} account — Read Only Mode</span></div>}
      {showVoicePanel&&<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"#1A2344",borderRadius:16,padding:"16px 20px",width:340,maxWidth:"90vw",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",border:"2px solid "+(voiceState==="listening"?"#ef4444":voiceState==="speaking"?"#C8963E":"#3b82f6")}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{voiceState==="listening"?"🔴":voiceState==="speaking"?"🔊":voiceState==="processing"?"⏳":"🎙"}</span><span style={{color:"#C8963E",fontWeight:700,fontSize:15,fontFamily:"Arial"}}>Hey {assistantName()}</span></div><button onClick={()=>{stopListening();setShowVoicePanel(false);}} style={{background:"transparent",border:"none",color:"#aaa",cursor:"pointer",fontSize:18,lineHeight:1}}>x</button></div>{voiceTranscript&&<div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",marginBottom:8}}><div style={{fontSize:11,color:"#aaa",fontFamily:"Arial",marginBottom:2}}>You said:</div><div style={{fontSize:14,color:"#fff",fontFamily:"Arial"}}>{voiceTranscript}</div></div>}{voiceResponse&&<div style={{background:"rgba(200,150,62,0.15)",borderRadius:8,padding:"8px 12px",marginBottom:8,border:"1px solid rgba(200,150,62,0.3)"}}><div style={{fontSize:11,color:"#C8963E",fontFamily:"Arial",marginBottom:2}}>{assistantName()} says:</div><div style={{fontSize:14,color:"#fff",fontFamily:"Arial",lineHeight:1.5}}>{voiceResponse}</div></div>}<div style={{textAlign:"center"}}><button onClick={voiceState==="idle"?startListening:stopListening} style={{background:voiceState==="listening"?"#ef4444":"#C8963E",border:"none",borderRadius:50,width:56,height:56,fontSize:24,cursor:"pointer",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{voiceState==="listening"?"⏹":"🎙"}</button><div style={{fontSize:11,color:"#aaa",fontFamily:"Arial",marginTop:6}}>{voiceState==="listening"?"Tap to stop":voiceState==="processing"?"Thinking...":voiceState==="speaking"?"Speaking...":"Tap to speak"}</div></div></div>}
      {isManager&&<div style={{background:"#065f46",color:"#d1fae5",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"2px solid #059669"}}><span style={{fontSize:14,fontFamily:"Arial,sans-serif"}}>🩺 Managing household account — Caregiver Mode</span></div>}
      {seniorMode&&<div style={{background:"#1a2e3a",borderBottom:"2px solid #60a5fa",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",paddingRight:180}}><span style={{fontFamily:"system-ui",fontSize:20,color:"#93c5fd",fontWeight:700}}>👴 Senior-Friendly Mode is On</span><button onClick={()=>{if(window.confirm("Turn off larger text and simplified navigation?"))setSeniorMode(false);}} style={{background:"transparent",border:"2px solid #60a5fa",borderRadius:8,color:"#93c5fd",cursor:"pointer",fontFamily:"system-ui",fontSize:16,padding:"8px 18px",fontWeight:600}}>Turn Off</button></div>}
      {showInventoryReminder&&(
        <div style={{background:"#1a2e1a",borderBottom:"2px solid #22c55e",padding:"10px 16px",paddingRight:180,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
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
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          <div>
            <div style={{fontFamily:FD,fontSize:seniorMode?36:26,color:C.accent,lineHeight:1}}>Smart Kitchen™</div>
            <div style={{fontSize:seniorMode?15:11,color:C.muted,marginTop:3,fontFamily:FM}}>
              {totalPortions} protein portions · {blendItem?.qty||0} blend bags · {inventory.length} items
              {restrictedProfiles.length>0&&<span style={{...bTag("#f472b6"),marginLeft:8,fontSize:9}}>⚕ dietary restrictions active</span>}
            </div>
          </div>
          <button onClick={()=>{const n=!darkMode;setDarkMode(n);try{localStorage.setItem("sk_darkMode",n?"1":"0");}catch{}}} title={darkMode?"Switch to Light Mode":"Switch to Dark Mode"}
            style={{background:"transparent",border:"2px solid "+C.accent+"66",borderRadius:8,color:C.accent,cursor:"pointer",fontSize:seniorMode?26:22,padding:seniorMode?"8px 12px":"6px 10px",marginTop:2,lineHeight:1,transition:"all 0.15s"}}>
            {darkMode?"🌙":"☀️"}
          </button>
          <button onClick={()=>setShowSettings(true)} title="Settings"
            style={{background:"transparent",border:"2px solid "+C.accent+"66",borderRadius:8,color:C.accent,cursor:"pointer",fontSize:seniorMode?26:22,padding:seniorMode?"8px 12px":"6px 10px",marginTop:2,lineHeight:1,transition:"all 0.15s"}}
            onMouseOver={e=>e.currentTarget.style.color=C.accent}
            onMouseOut={e=>e.currentTarget.style.color=C.muted}>
            ⚙
          </button>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px"}} onClick={()=>setProfileModalOpen(true)}>👨‍👩‍👧 Family</button>
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px",border:"1px solid "+(seniorMode?C.blue:C.border),color:seniorMode?C.blue:C.muted}} onClick={()=>setSeniorMode(m=>!m)}>{seniorMode?"Aa On":"Aa Off"}</button>
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px"}} onClick={()=>openRepack("veg")}>🫕 Prep Veg</button>
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px"}} onClick={()=>openRepack("protein")} disabled={isViewer}>🥩 Repackage</button>
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px"}} onClick={()=>{setScanOpen(true);setScanStage("upload");setScanResults(null);setScanPreview(null);setScanB64(null);setScanMode("shelf");}} disabled={isViewer}>📷 Scan</button>       <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px"}} onClick={()=>{
            if(!can.unlimitedRecipes){
              setUpgradeModal({feature:"Unlimited Recipe Suggestions",desc:"Get unlimited AI-powered recipe suggestions based on exactly what you have in your kitchen.",icon:"🍽"});
              return;
            }
            fetchRecipes();
          }}>✨ Recipes</button>
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px",border:"1px solid "+C.accent,color:C.accent}} onClick={()=>{setMakeThisModal(true);setMakeThisInput("");setMakeThisResult(null);}}>🍽 Make This</button>
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px",border:"1px solid #b45309",color:"#b45309"}} onClick={()=>{setFamilyRecipesOpen(true);setFrAddMode(null);setFrEditRecipe(null);setFrViewRecipe(null);}}>📖 Family Recipes</button>
          {(restrictedProfiles.length>0||can.medicalCompliance)&&<button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px",border:"1px solid #dc2626",color:"#dc2626",fontWeight:600}} onClick={()=>{setCanIHaveOpen(true);setCanIHaveImg(null);setCanIHaveResult(null);setCanIHaveText("");}}>Can I Have This?</button>}
          {can.medicalCompliance&&<button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px",border:"1px solid #3b82f6",color:"#3b82f6",fontWeight:600}} onClick={()=>{setShowScaleModal(true);setScaleError("");setScaleCalcResult(null);}}>⚖ Scale</button>}
          <button style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px",border:"1px solid "+C.accent,color:C.accent,fontWeight:600}} onClick={()=>{setShowOccasionPlanner(true);setOccasionStep("form");setOccasionResult(null);setOccasionDate("");}}>🎉 Plan Occasion</button>
          <button onClick={voiceState==="listening"?stopListening:voiceState==="speaking"?stopListening:startListening} style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 16px":"7px 12px",border:"2px solid "+(voiceState==="listening"?"#ef4444":voiceState==="speaking"?"#C8963E":voiceState==="processing"?"#8b5cf6":"#1A2344"),color:voiceState==="listening"?"#ef4444":voiceState==="speaking"?"#C8963E":voiceState==="processing"?"#8b5cf6":"#1A2344",fontWeight:700,minWidth:seniorMode?90:70}} title={"Hey "+assistantName()+" — tap to speak"}>{voiceState==="listening"?"🔴 Listening...":voiceState==="processing"?"⏳ Thinking...":voiceState==="speaking"?"🔊 Speaking...":("🎙 Hey "+assistantName())}</button>
        </div>
      </div>

      {/* -- Tabs -- */}
      <div style={{display:"flex",background:C.surface,borderBottom:"1px solid "+C.border,paddingLeft:12,overflowX:"auto"}}>
        {[["inventory","📦","Inventory"],["recipes","🍽","Recipes"],["saved","⭐","Saved"],["mealplan","📅","Meal Plan"],["shopping","🛒","Shopping"],["desserts","🍰","Desserts"],["leftovers","🥡","Leftovers"],["substitute","🔄","Substitute"]].map(([k,ic,lb])=>(
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
            <div style={{background:C.card,border:"1px solid "+C.borderLight,borderRadius:12,padding:"14px 18px",marginBottom:18,display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:16,alignItems:"start"}}>
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

            {/* Filters */}{/* Search + Sort */}<div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}><input value={invSearch} onChange={e=>setInvSearch(e.target.value)} placeholder="Search inventory..." style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid "+C.border,background:C.surface,color:C.text,fontFamily:"FM",fontSize:13}}/><select value={invSort} onChange={e=>setInvSort(e.target.value)} style={{padding:"8px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.surface,color:C.text,fontFamily:"FM",fontSize:12,colorScheme:darkMode?"dark":"light"}}><option value="category">Sort: Category</option><option value="name">Sort: A-Z</option></select></div>
            <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              {["All",...LOCATIONS].map(l=>(
                <button key={l} onClick={()=>setFilterLoc(l)} style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11,background:filterLoc===l?(LOC_COLORS[l]||C.accent)+"22":"transparent",color:filterLoc===l?(LOC_COLORS[l]||C.accent):C.muted,border:"1px solid "+(filterLoc===l?(LOC_COLORS[l]||C.accent):C.border)}}>
                  {l!=="All"?LOC_ICONS[l]+" ":""}{l}
                </button>
              ))}
              <button onClick={()=>setFilterCat(filterCat==="Wild Harvest"?"All":"Wild Harvest")} style={{...bBtn("ghost"),padding:"6px 10px",fontSize:11,background:filterCat==="Wild Harvest"?"#1a3a1a":"transparent",border:"1px solid "+(filterCat==="Wild Harvest"?"#4c4":C.border),color:filterCat==="Wild Harvest"?"#4c4":C.muted}}>🦌 Wild Harvest</button><button onClick={()=>setFilterCat(filterCat==="Home Harvest"?"All":"Home Harvest")} style={{...bBtn("ghost"),padding:"6px 10px",fontSize:11,background:filterCat==="Home Harvest"?"#1a3a1a":"transparent",border:"1px solid "+(filterCat==="Home Harvest"?"#4c4":C.border),color:filterCat==="Home Harvest"?"#4c4":C.muted}}>🌱 Home Harvest</button><select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...bInp,width:"auto",padding:"7px 12px",fontSize:11}}>
                <option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
              <button style={bBtn("ghost")} onClick={()=>setShowAdd(v=>!v)}>{showAdd?"✕ Cancel":"+ Add"}</button>
              {inventory.filter(i=>i.category==="Wild Harvest"||i.category==="Home Harvest"||(i.isBulkProtein&&i.category==="Protein")||i.vegType==="sauteBlend").length>0&&(<button style={{...bBtn("ghost"),background:"#1a3a1a",border:"1px solid #4c4",color:"#4c4"}} onClick={()=>{setLabelSelected({});setLabelModal(true);}}>🏷 Print Labels</button>)}
            </div>

            {showAdd&&(
              <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:14,marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:8,alignItems:"end",marginBottom:6}}>
                  {[{l:"Name",k:"name",ph:"Item name"},{l:"Qty",k:"qty",ph:"1",t:"number"},{l:"Unit",k:"unit",ph:"cup"}].map(f=>(
                    <div key={f.k}><Label>{f.l}</Label><input style={bInp} spellCheck={f.k==="name"} placeholder={f.ph} type={f.t||"text"} value={newItem[f.k]} onChange={e=>setNewItem(p=>({...p,[f.k]:e.target.value}))}/></div>
                  ))}
                  <button style={{...bBtn("primary"),whiteSpace:"nowrap",alignSelf:"flex-end"}} onClick={addItem}>Add</button>
                </div>
                {(()=>{ const m=findCloseInventoryMatch(newItem.name,inventory); return m&&(
                  <div style={{marginBottom:10,fontSize:11,color:C.orange,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span>Did you mean <strong>{m}</strong>? Typos create a separate item instead of adding to the existing one.</span>
                    <button onClick={()=>setNewItem(p=>({...p,name:m}))} style={{...bBtn("ghost"),padding:"2px 8px",fontSize:10,border:"1px solid "+C.orange,color:C.orange}}>Use "{m}"</button>
                  </div>
                );})()}
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontFamily:FM,fontSize:11,color:C.muted,marginRight:2}}>Category:</span>
                  {[["Protein","#ef4444"],["Produce","#22c55e"],["Dairy","#60a5fa"],["Frozen","#a78bfa"],["Pantry","#f59e0b"],["Baking","#f472b6"],["Grains","#d97706"],["Condiments","#94a3b8"],["Other","#6b7280"],["Wild Harvest","#5a8a2e"],["Home Harvest","#2e8a5a"]].map(([cat,col])=>(
                    <button key={cat} onClick={()=>{const autoLoc=cat==="Protein"?"Freezer":cat==="Dairy"||cat==="Produce"?"Fridge":cat==="Frozen"?"Freezer":cat==="Wild Harvest"||cat==="Home Harvest"?newItem.location:newItem.location;const isHarvest=cat==="Wild Harvest"||cat==="Home Harvest";setNewItem(p=>({...p,category:cat,location:autoLoc,harvestType:isHarvest?p.harvestType:""}));}} style={{padding:"4px 10px",borderRadius:20,border:"2px solid "+(newItem.category===cat?col:"transparent"),background:newItem.category===cat?col+"22":"transparent",color:newItem.category===cat?col:C.muted,fontFamily:FM,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>{cat}</button>
                  ))}
                  <span style={{marginLeft:"auto",fontFamily:FM,fontSize:11,color:C.muted,whiteSpace:"nowrap",paddingLeft:8}}>📍 Location:</span>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {["Freezer","Fridge","Pantry"].map(loc=>(
                      <button key={loc} onClick={()=>setNewItem(p=>({...p,location:loc}))} style={{padding:"4px 10px",borderRadius:20,border:"2px solid "+(newItem.location===loc?C.accent:"transparent"),background:newItem.location===loc?C.accent+"22":"transparent",color:newItem.location===loc?C.accent:C.muted,fontFamily:FM,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{loc}</button>
                    ))}
                  </div>
                </div>
                {(newItem.category==="Wild Harvest"||newItem.category==="Home Harvest")&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:8,paddingTop:8,borderTop:"1px solid "+C.border}}>
                    <span style={{fontFamily:FM,fontSize:11,color:C.muted,marginRight:2}}>{newItem.category==="Wild Harvest"?"🦌":"🌱"} Type:</span>
                    {[["Protein","🥩","#ef4444"],["Produce","🥦","#22c55e"],["Pantry","🫙","#f59e0b"]].map(([ht,ico,col])=>(
                      <button key={ht} onClick={()=>setNewItem(p=>({...p,harvestType:ht}))} style={{padding:"4px 12px",borderRadius:20,border:"2px solid "+(newItem.harvestType===ht?col:"transparent"),background:newItem.harvestType===ht?col+"22":"transparent",color:newItem.harvestType===ht?col:C.muted,fontSize:11,cursor:"pointer",fontFamily:FM}}>
                        {ico} {ht}
                      </button>
                    ))}
                    {!newItem.harvestType&&<span style={{fontSize:10,color:C.dim,marginLeft:4}}>Select a type to count toward protein or produce</span>}
                  </div>
                )}
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
                        {item.isLow&&<div style={bTag(C.red)}>⚠ Low</div>}
                      </div>
                      <button onClick={()=>setInventory(p=>p.filter(i=>i.id!==item.id))} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:14,padding:2}}>✕</button>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                      <select value={item.category} onChange={e=>{const cat=e.target.value;const autoLoc=cat==="Protein"?"Freezer":cat==="Dairy"||cat==="Produce"?"Fridge":cat==="Frozen"?"Freezer":cat==="Baking"?"Pantry":item.location;setInventory(p=>p.map(i=>i.id===item.id?{...i,category:cat,location:autoLoc}:i));}} onClick={e=>e.stopPropagation()} style={{fontSize:11,fontWeight:600,padding:"2px 4px",borderRadius:8,border:"1px solid "+(CAT_COLORS[item.category]||C.muted)+"88",background:(CAT_COLORS[item.category]||C.muted)+"22",color:CAT_COLORS[item.category]||C.muted,cursor:"pointer",maxWidth:100,colorScheme:darkMode?"dark":"light"}}>
                        {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                      <select value={item.location||"Pantry"} onChange={e=>setInventory(p=>p.map(i=>i.id===item.id?{...i,location:e.target.value}:i))} onClick={e=>e.stopPropagation()} style={{fontSize:11,fontWeight:600,padding:"2px 4px",borderRadius:8,border:"1px solid "+(LOC_COLORS[item.location]||C.muted)+"88",background:(LOC_COLORS[item.location]||C.muted)+"22",color:LOC_COLORS[item.location]||C.muted,cursor:"pointer",colorScheme:darkMode?"dark":"light"}}>
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
                <div style={{fontSize:11,fontFamily:FM,color:"#f472b6",marginBottom:4}}>⚕ DIETARY RESTRICTIONS ACTIVE</div>
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
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                  {exploreResults?<div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontFamily:FD,fontSize:22,color:"#0ea5e9"}}>🧭 {exploreResults.query}</div><button onClick={()=>{setExploreResults(null);setExploreQuery("");}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #0ea5e9",background:"transparent",color:"#0ea5e9",fontFamily:FM,fontSize:11,cursor:"pointer"}}>Clear → My Recipes</button></div>:<div style={{fontFamily:FD,fontSize:22}}>Recipe Suggestions</div>}
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...bBtn("ghost"),border:"1px solid "+C.accent,color:C.accent}} onClick={()=>setShowOccasionPlanner(true)}>🎉 Occasion</button>
                        <button onClick={()=>{setPairDrinkMeal(day);setPairDrinkResult(null);}} style={{background:"transparent",border:"1px solid #7c3aed44",borderRadius:seniorMode?10:4,color:"#7c3aed",fontFamily:FM,fontSize:seniorMode?18:11,padding:seniorMode?"12px 20px":"8px 14px",cursor:"pointer",flexShrink:0}}>🍷 Pair a Drink</button>
                    <button style={bBtn("ghost")} onClick={fetchRecipes}>🔄 Refresh</button>
                    <button style={{...bBtn("ghost"),border:"1px solid #0ea5e9",color:"#0ea5e9"}} onClick={()=>{setExploreOpen(true);setExploreQuery("");setExploreMode("");}}>🧭 Explore</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
                  {(exploreResults?exploreResults.recipes:recipes.filter(r=>(recipeRatings[r.name]||0)!==1||(recipeRatings[r.name]||0)===1)).map(r=>{
                    const rating=recipeRatings[r.name]?.rating||0;
                    return(
                    <div key={r.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.15s",opacity:rating===1?0.5:1}}
                      onClick={()=>setActiveRecipe(r)}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.cardHover;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
                      {mealPhotos[r.name]&&<div style={{marginBottom:10,borderRadius:8,overflow:"hidden"}}><img src={mealPhotos[r.name]} alt={r.name} style={{width:"100%",maxHeight:140,objectFit:"cover",display:"block",borderRadius:8}} /></div>}
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"flex-start"}}>
                        <div style={{fontFamily:FD,fontSize:seniorMode?26:19,lineHeight:1.3,flex:1}}><a href={getRecipeUrl(r.name)} target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:"none"}}>🔍 {r.name}</a></div>
                        <span style={{...bTag(r.difficulty==="Easy"?C.green:r.difficulty==="Hard"?C.red:C.accent),marginLeft:8}}>{r.difficulty}</span>
                      </div>
                      <div style={{color:C.muted,fontSize:seniorMode?17:13,marginBottom:8,lineHeight:1.6}}>{r.description}</div>
                      {/* Star Rating */}
                      <div style={{display:"flex",gap:4,marginBottom:10}} onClick={e=>e.stopPropagation()}>
                        {[1,2,3,4,5].map(star=>(
                          <button key={star} onClick={e=>{e.stopPropagation();const mealName=r.name;setRecipeRatings(prev=>{const cur=prev[r.name]?.rating||0;const next={...prev};if(cur===star){delete next[r.name];}else{next[r.name]={rating:star,recipe:r};}try{localStorage.setItem("sk_recipeRatings",JSON.stringify(next));}catch{}if(star===5&&cur!==5){const skips=parseInt(localStorage.getItem("sk_photoSkipCount")||"0");if(skips<3) setTimeout(()=>setPhotoPromptMeal(mealName),300);}return next;});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:seniorMode?22:16,padding:"0 1px",color:star<=(recipeRatings[r.name]?.rating||0)?"#f59e0b":"#555",transition:"color 0.1s"}} title={star===1?"Never suggest again":star===5?"Keeper!":"Rate "+star+" stars"}>
                            {star<=(recipeRatings[r.name]?.rating||0)?"★":"☆"}
                          </button>
                        ))}
                        {rating>=3&&<span style={{fontSize:10,color:C.muted,fontFamily:FM,marginLeft:4,alignSelf:"center"}}>{rating===5?"🏆 Keeper":rating===4?"❤ Favorite":"👍 Good"}</span>}
                        {rating===1&&<span style={{fontSize:10,color:C.red,fontFamily:FM,marginLeft:4,alignSelf:"center"}}>🚫 Excluded</span>}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        <span style={{...bTag(C.muted),fontSize:seniorMode?14:undefined}}>⏱ {r.time}</span>
                        <span style={bTag(C.blue)}>👨‍👩‍👧 {activeProfiles.length} people</span>
                        <span style={{...bTag(C.green),fontSize:seniorMode?14:undefined}}>✅ {(r.usesFromInventory||[]).length} on hand</span>
                        {(r.missingIngredients||[]).length>0&&<span style={{...bTag(C.red),fontSize:seniorMode?14:undefined}}>🛒 {r.missingIngredients.length} needed</span>}
                      </div>
                      <div style={{fontSize:seniorMode?17:11,color:C.accent,fontFamily:FM,fontWeight:seniorMode?700:400}}>TAP FOR FULL RECIPE →</div>
                      <div style={{marginTop:10,display:"flex",gap:8}}>
                      <button onClick={e=>{e.stopPropagation();printRecipeCard(r,mealPhotos[r.name]);}} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+C.border,background:C.surface,color:C.text,fontSize:12,cursor:"pointer"}}>🖨 Print</button>
                      <button onClick={e=>{e.stopPropagation();setAddToPlanRecipe(r);setAddToPlanDay("");}} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #2aa86e",background:"#2aa86e",color:"#fff",fontFamily:FM,fontSize:12,cursor:"pointer",fontWeight:600}} disabled={isViewer}>📅 Add to Plan</button>
                      <button onClick={e=>{e.stopPropagation();setSwapRecipeModal(r);setSwapRecipeRequest("");}} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+C.border,background:C.surface,color:C.text,fontFamily:FM,fontSize:12,cursor:"pointer"}} disabled={isViewer}>✦ Swap Recipe</button><button onClick={e=>{e.stopPropagation();setPhotoPromptMeal(r.name);}} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+C.border,background:C.surface,color:C.muted,fontFamily:FM,fontSize:seniorMode?16:12,cursor:"pointer"}} title="Add photo" disabled={isViewer}>📸 {mealPhotos[r.name]?"Change":"Photo"}</button></div>
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        )}

        {exploreOpen&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setExploreOpen(false)}><div style={{background:C.card,borderRadius:16,padding:28,width:400,maxWidth:"92vw"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:"#0ea5e9",marginBottom:6}}>🧭 Explore Recipes</div><div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:18}}>What are you in the mood for? Type anything — a cuisine, ingredient, vibe, or dish name.</div><input value={exploreQuery} onChange={e=>setExploreQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&exploreQuery.trim()&&exploreMode){const doExplore=async()=>{setExploreOpen(false);setExploreLoading(true);const inventoryStr=exploreMode==="pantry"?("Use ONLY these ingredients where possible: "+inventory.map(i=>i.name).filter(Boolean).join(", ")):"You may use any ingredients.";const fs=familySummary?familySummary():"";const raw=await callClaude({system:"Return ONLY a JSON array of 4 dinner recipes. No other text. Start with [ end with ]. Each: id (number), name (string), time (string), difficulty (Easy/Medium/Hard), description (one sentence), usesFromInventory (array of strings), missingIngredients (array of strings), instructions (array of 4 strings)."+(fs?" DIETARY RULES: "+fs:""),prompt:"Explore: "+exploreQuery+". "+inventoryStr+" Make 4 varied dinners. Keep strings short."});try{const txt=typeof raw==="string"?raw:Array.isArray(raw)?raw.map(r=>r.text||"").join(""):raw&&raw.content&&raw.content[0]?raw.content[0].text||"":"";const clean=txt.replace(/```json|```/g,"").trim();const parsed=JSON.parse(clean);setExploreResults({query:exploreQuery,recipes:parsed.map((r,i)=>({...r,id:Date.now()+i}))});}catch(er){alert("Could not load explore results. Try again.");}setExploreLoading(false);};doExplore();}}} placeholder="e.g. Italian, spicy, salmon, comfort food..." style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"2px solid #0ea5e9",background:C.surface,color:C.text,fontFamily:FM,fontSize:14,boxSizing:"border-box",marginBottom:16,outline:"none"}}/><div style={{fontFamily:FM,fontSize:13,color:C.text,fontWeight:600,marginBottom:10}}>How should I find recipes?</div><div style={{display:"flex",gap:10,marginBottom:20}}><button onClick={()=>setExploreMode("pantry")} style={{flex:1,padding:"14px 10px",borderRadius:10,border:"2px solid "+(exploreMode==="pantry"?"#2aa86e":C.border),background:exploreMode==="pantry"?"#2aa86e11":C.surface,color:exploreMode==="pantry"?"#2aa86e":C.text,fontFamily:FM,fontSize:12,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22,marginBottom:4}}>🏠</div><div style={{fontWeight:700}}>Use What I Have</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>Recipes from your pantry</div></button><button onClick={()=>setExploreMode("open")} style={{flex:1,padding:"14px 10px",borderRadius:10,border:"2px solid "+(exploreMode==="open"?"#0ea5e9":C.border),background:exploreMode==="open"?"#0ea5e911":C.surface,color:exploreMode==="open"?"#0ea5e9":C.text,fontFamily:FM,fontSize:12,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22,marginBottom:4}}>🌍</div><div style={{fontWeight:700}}>Open Exploration</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>Any ingredients welcome</div></button></div><button onClick={async()=>{if(!exploreQuery.trim()){alert("Please enter what you are looking for.");return;}if(!exploreMode){alert("Please choose Use What I Have or Open Exploration.");return;}setExploreOpen(false);setExploreLoading(true);const inventoryStr=exploreMode==="pantry"?("Use ONLY these ingredients where possible: "+inventory.map(i=>i.name).filter(Boolean).join(", ")):"You may use any ingredients.";const fs=familySummary?familySummary():"";const raw=await callClaude({system:"Return ONLY a JSON array of 4 dinner recipes. No other text. Start with [ end with ]. Each: id (number), name (string), time (string), difficulty (Easy/Medium/Hard), description (one sentence), usesFromInventory (array of strings), missingIngredients (array of strings), instructions (array of 4 strings)."+(fs?" DIETARY RULES: "+fs:""),prompt:"Explore: "+exploreQuery+". "+inventoryStr+" Make 4 varied dinners. Keep strings short."});try{const txt=typeof raw==="string"?raw:Array.isArray(raw)?raw.map(r=>r.text||"").join(""):raw&&raw.content&&raw.content[0]?raw.content[0].text||"":"";const clean=txt.replace(/```json|```/g,"").trim();const parsed=JSON.parse(clean);setExploreResults({query:exploreQuery,recipes:parsed.map((r,i)=>({...r,id:Date.now()+i}))});}catch(er){alert("Could not load explore results. Try again.");}setExploreLoading(false);}} style={{width:"100%",padding:"13px",borderRadius:8,background:"#0ea5e9",border:"none",color:"#fff",fontFamily:FM,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:8}}>🧭 Explore</button><button onClick={()=>setExploreOpen(false)} style={{width:"100%",padding:"8px",borderRadius:8,background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer"}}>Cancel</button></div></div>}
{exploreLoading&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><div style={{fontFamily:FD,fontSize:28,color:"#fff"}}>🧭 Exploring...</div><div style={{fontFamily:FM,fontSize:14,color:"#94a3b8"}}>Finding the perfect recipes for you</div></div>}
{swapRecipeModal&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSwapRecipeModal(null)}><div style={{background:C.card,borderRadius:12,padding:24,width:360,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:C.text,marginBottom:16}}>Swap Recipe</div><button onClick={async()=>{setSwapRecipeLoading(true);const prompt="Give me ONE different recipe suggestion"+( swapRecipeRequest.trim()?" for: "+swapRecipeRequest.trim():" (different from "+swapRecipeModal.name+")")+". Inventory: "+inventory.map(i=>i.name).filter(Boolean).join(", ")+". Return ONLY valid JSON: {name,description,time,difficulty,instructions:[4 short strings],usesFromInventory:[],missingIngredients:[]}";const res=await callClaude({system:"Recipe AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{const raw=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||"";const clean=raw.replace(/```json|```/g,"").trim();const parsed=JSON.parse(clean);setRecipes(prev=>prev.map(r=>r.id===swapRecipeModal.id?{...parsed,id:swapRecipeModal.id,usesFromInventory:parsed.usesFromInventory||[],missingIngredients:parsed.missingIngredients||[]}:r));setSwapRecipeModal(null);}catch(e){alert("Could not parse recipe.");}setSwapRecipeLoading(false);}} style={{width:"100%",padding:"12px",borderRadius:8,background:C.accent,border:"none",color:"#000",fontFamily:FM,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>{swapRecipeLoading?"Thinking...":"✦ Surprise Me"}</button><div style={{color:C.muted,fontFamily:FM,fontSize:12,textAlign:"center",marginBottom:8}}>— or request a specific recipe —</div><input value={swapRecipeRequest} onChange={e=>setSwapRecipeRequest(e.target.value)} placeholder='e.g. "Something with chicken"' style={{width:"100%",padding:"8px 12px",borderRadius:6,border:"1px solid "+C.border,background:C.surface,color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box",marginBottom:10}}/><button onClick={async()=>{if(!swapRecipeRequest.trim()){alert("Please type a recipe request first.");return;}setSwapRecipeLoading(true);const prompt="Give me ONE recipe for: "+swapRecipeRequest.trim()+". Inventory: "+inventory.map(i=>i.name).filter(Boolean).join(", ")+". Return ONLY valid JSON: {name,description,time,difficulty,instructions:[4 short strings],usesFromInventory:[],missingIngredients:[]}";const res=await callClaude({system:"Recipe AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{const raw=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||"";const clean=raw.replace(/```json|```/g,"").trim();const parsed=JSON.parse(clean);setRecipes(prev=>prev.map(r=>r.id===swapRecipeModal.id?{...parsed,id:swapRecipeModal.id,usesFromInventory:parsed.usesFromInventory||[],missingIngredients:parsed.missingIngredients||[]}:r));setSwapRecipeModal(null);}catch(e){alert("Could not parse recipe.");}setSwapRecipeLoading(false);}} style={{width:"100%",padding:"12px",borderRadius:8,background:"transparent",border:"1px solid "+C.accent,color:C.accent,fontFamily:FM,fontSize:14,cursor:"pointer",marginBottom:8}}>Make This Recipe</button><button onClick={()=>setSwapRecipeModal(null)} style={{width:"100%",padding:"8px",borderRadius:8,background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer"}}>Cancel</button></div></div>}
        {addToPlanRecipe&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setAddToPlanRecipe(null)}><div style={{background:C.card,borderRadius:14,padding:24,width:340,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>📅 Add to Meal Plan</div><div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:16}}>{"Choose a day for: "+addToPlanRecipe.name}</div><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day=>{const existing=mealPlan.find(d=>d.day===day);const isSelected=addToPlanDay===day;return(<button key={day} onClick={()=>setAddToPlanDay(day)} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"2px solid "+(isSelected?"#2aa86e":C.border),background:isSelected?"#2aa86e22":C.surface,color:isSelected?"#2aa86e":C.text,fontFamily:FM,fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:isSelected?700:400}}>{day}</span>{existing&&<span style={{fontSize:11,color:C.muted,maxWidth:"60%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{existing.meal}</span>}</button>);})}</div><button onClick={()=>{if(!addToPlanDay){alert("Please select a day first.");return;}const existing=mealPlan.find(d=>d.day===addToPlanDay);if(existing&&existing.meal){setAddToPlanConfirm({recipe:addToPlanRecipe,day:addToPlanDay,existingMeal:existing.meal});setAddToPlanRecipe(null);}else{setMealPlan(prev=>prev.map(d=>d.day===addToPlanDay?{...d,meal:addToPlanRecipe.name,description:addToPlanRecipe.description||"",ingredients:addToPlanRecipe.usesFromInventory||[],shoppingNeeded:addToPlanRecipe.missingIngredients||[],proteinUsed:addToPlanRecipe.proteinUsed||"",quickMeal:addToPlanRecipe.quickMeal||false}:d));setAddToPlanRecipe(null);setAddToPlanDay("");setTab("mealplan");}}} style={{width:"100%",padding:"12px",borderRadius:8,background:"#2aa86e",border:"none",color:"#fff",fontFamily:FM,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8}}>📅 Add to Plan</button><button onClick={()=>{setAddToPlanRecipe(null);setAddToPlanDay("");}} style={{width:"100%",padding:"8px",borderRadius:8,background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer"}}>Cancel</button></div></div>}
        {addToPlanConfirm&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setAddToPlanConfirm(null)}><div style={{background:C.card,borderRadius:14,padding:24,width:320,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}><div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:C.text,marginBottom:12}}>↔️ Replace Meal?</div><div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:6}}>{addToPlanConfirm.day+" currently has:"}</div><div style={{fontFamily:FM,fontSize:14,color:C.text,fontWeight:600,marginBottom:12,padding:"8px 12px",background:C.surface,borderRadius:8}}>{addToPlanConfirm.existingMeal}</div><div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:6}}>Replace with:</div><div style={{fontFamily:FM,fontSize:14,color:"#2aa86e",fontWeight:600,marginBottom:20,padding:"8px 12px",background:"#2aa86e11",borderRadius:8}}>{addToPlanConfirm.recipe.name}</div><button onClick={()=>{setMealPlan(prev=>prev.map(d=>d.day===addToPlanConfirm.day?{...d,meal:addToPlanConfirm.recipe.name,description:addToPlanConfirm.recipe.description||"",ingredients:addToPlanConfirm.recipe.usesFromInventory||[],shoppingNeeded:addToPlanConfirm.recipe.missingIngredients||[],proteinUsed:addToPlanConfirm.recipe.proteinUsed||"",quickMeal:addToPlanConfirm.recipe.quickMeal||false}:d));setAddToPlanConfirm(null);setAddToPlanDay("");setTab("mealplan");}} style={{width:"100%",padding:"12px",borderRadius:8,background:"#2aa86e",border:"none",color:"#fff",fontFamily:FM,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8}}>Yes, Replace It</button><button onClick={()=>setAddToPlanConfirm(null)} style={{width:"100%",padding:"8px",borderRadius:8,background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer"}}>Keep Existing Meal</button></div></div>}
        {/* == SAVED RECIPES == */}
        {tab==="saved"&&(
          <div style={{padding:20,maxWidth:940,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
              <div style={{fontFamily:FD,fontSize:22,color:C.text}}>⭐ Saved Recipes</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[["all","All"],["keepers","🏆 Keepers"],["good","👍 3+"]].map(([f,lb])=>(
                  <button key={f} onClick={()=>setSavedRecipesFilter(f)} style={{...bBtn(savedRecipesFilter===f?"primary":"ghost"),fontSize:seniorMode?15:11,padding:seniorMode?"10px 16px":"5px 10px"}}>{lb}</button>
                ))}
                <button onClick={()=>setShowImportModal(true)} style={{...bBtn("ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 14px":"5px 10px",border:"1px solid #8b5cf6",color:"#8b5cf6"}}>📥 Import</button>
                <button onClick={()=>{setShareMode(m=>!m);setShareSelected({});}} style={{...bBtn(shareMode?"primary":"ghost"),fontSize:seniorMode?14:11,padding:seniorMode?"10px 14px":"5px 10px",border:"1px solid "+C.accent,color:shareMode?"#0c0e14":C.accent}}>{shareMode?"✕ Cancel":"📤 Share"}</button>
              </div>
            </div>
            {shareMode&&Object.keys(shareSelected).length>0&&(
              <div style={{background:C.accent+"18",border:"1px solid "+C.accent+"44",borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <span style={{fontFamily:FM,fontSize:12,color:C.accent,fontWeight:600}}>{Object.keys(shareSelected).length} recipe{Object.keys(shareSelected).length>1?"s":""} selected</span>
                <button onClick={()=>setShowShareModal(true)} style={{...bBtn("primary"),fontSize:12,padding:"7px 16px"}}>📤 Share These</button>
              </div>
            )}
            {(Object.keys(recipeRatings).filter(name=>recipeRatings[name]?.rating>=3).length+Object.keys({...loadLocal("sk_dessertRatings",{}),...dessertRatings}).filter(name=>({...loadLocal("sk_dessertRatings",{}),...dessertRatings})[name]?.rating>=3).length)===0?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{fontSize:48,marginBottom:16}}>⭐</div>
                <div style={{color:C.muted,fontFamily:FM,fontSize:14,marginBottom:8}}>No saved recipes yet</div>
                <div style={{color:C.muted,fontFamily:FM,fontSize:12}}>Rate a recipe or dessert 3 stars or more to save it here.</div>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
                {[...Object.entries(recipeRatings).map(([name,v])=>({name,v,type:"recipe"})),...Object.entries({...loadLocal("sk_dessertRatings",{}),...dessertRatings}).map(([name,v])=>({name,v,type:"dessert"}))]
                  .filter(({v})=>v?.rating>=3)
                  .filter(({v})=>savedRecipesFilter==="keepers"?v?.rating===5:savedRecipesFilter==="good"?v?.rating>=3:true)
                  .sort((a,b)=>b.v.rating-a.v.rating)
                  .map(({name,v,type})=>{
                    const rating=v?.rating||0;
                    const r=v?.recipe||{name,description:"",time:"",difficulty:"Easy",usesFromInventory:[],missingIngredients:[]};
                    const isDesert=type==="dessert";
                    return(
                  <div key={type+"-"+name} style={{background:C.card,border:"2px solid "+(shareMode&&shareSelected[name]?"#8b5cf6":rating===5?"#f59e0b":C.border),borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.15s",position:"relative"}}
                    onClick={()=>{
                      if(shareMode){setShareSelected(prev=>{const next={...prev};
                        if(next[name])delete next[name];
                        else next[name]={name,description:r.description||"",ingredients:r.ingredients||[],
                          time:r.time||"",difficulty:r.difficulty||"Easy",servings:r.servings||"",
                          isFamilyRecipe:false,rating};
                        return next;});return;}
                      setActiveRecipe(r);}}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.cardHover;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=C.card;}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      {mealPhotos[name]&&<div style={{marginBottom:10,borderRadius:8,overflow:"hidden",gridColumn:"1/-1"}}><img src={mealPhotos[name]} alt={name} style={{width:"100%",maxHeight:140,objectFit:"cover",display:"block",borderRadius:8}} /></div>}
                    <div style={{fontFamily:FD,fontSize:seniorMode?26:19,lineHeight:1.3,flex:1}}><a href={getRecipeUrl(name)} target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:"none"}}>{isDesert?"🍰":"🔍"} {name}</a></div>
                      <span style={{...bTag(r.difficulty==="Easy"?C.green:r.difficulty==="Hard"?C.red:C.accent),marginLeft:8}}>{r.difficulty}</span>
                    </div>
                    {r.description&&<div style={{color:C.muted,fontSize:seniorMode?17:13,marginBottom:8,lineHeight:1.6}}>{r.description}</div>}
                    {/* Star rating */}
                    <div style={{display:"flex",gap:4,marginBottom:10}} onClick={e=>e.stopPropagation()}>
                      {[1,2,3,4,5].map(star=>(
                        <button key={star} onClick={e=>{e.stopPropagation();const mealName=name;const setter=isDesert?setDessertRatings:setRecipeRatings;setter(prev=>{const cur=prev[name]?.rating||0;const next={...prev};if(cur===star){delete next[name];}else{next[name]={rating:star,recipe:r};}if(star===5&&cur!==5){const skips=parseInt(localStorage.getItem("sk_photoSkipCount")||"0");if(skips<3) setTimeout(()=>setPhotoPromptMeal(mealName),300);}return next;});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:seniorMode?22:16,padding:"0 1px",color:star<=rating?"#f59e0b":"#555"}}>
                          {star<=rating?"★":"☆"}
                        </button>
                      ))}
                      <span style={{fontSize:10,color:rating===5?"#f59e0b":rating===4?C.green:C.muted,fontFamily:FM,marginLeft:4,alignSelf:"center",fontWeight:600}}>
                        {rating===5?"🏆 Keeper":rating===4?"❤ Favorite":"👍 Good"}
                      </span>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                      {r.time&&<span style={{...bTag(C.muted),fontSize:seniorMode?14:undefined}}>⏱ {r.time}</span>}
                      {(r.usesFromInventory||[]).length>0&&<span style={{...bTag(C.green),fontSize:seniorMode?14:undefined}}>✅ {r.usesFromInventory.length} on hand</span>}
                      {(r.missingIngredients||[]).length>0&&<span style={{...bTag(C.red),fontSize:seniorMode?14:undefined}}>🛒 {r.missingIngredients.length} needed</span>}
                    </div>
                    <div style={{fontSize:seniorMode?19:11,color:C.accent,fontFamily:FM,fontWeight:700,marginBottom:10,letterSpacing:seniorMode?0.5:0}}>TAP FOR FULL RECIPE →</div>
                    <div style={{display:"flex",gap:8,marginBottom:8}}>
                      <button onClick={e=>{e.stopPropagation();const today=new Date();const dateStr=today.toISOString().split("T")[0].replace(/-/g,"");window.open("https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent("Dinner: "+name)+"&dates="+dateStr+"/"+dateStr,"_blank");}} style={{flex:1,padding:seniorMode?"14px":"8px",borderRadius:8,border:"1px solid #5b9cf6",background:"transparent",color:"#5b9cf6",fontFamily:FM,fontSize:seniorMode?16:11,cursor:"pointer"}} disabled={isViewer}>📅 Add to Calendar</button>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={e=>{e.stopPropagation();if(isDesert){setDessertRatings(prev=>{const next={...prev};delete next[name];return next;});}else{setRecipeRatings(prev=>{const next={...prev};delete next[name];return next;});}}} style={{flex:1,padding:seniorMode?"14px":"8px",borderRadius:8,border:"1px solid "+C.red,background:"transparent",color:C.red,fontFamily:FM,fontSize:seniorMode?16:11,cursor:"pointer"}}>🗑 Remove</button>
                      <button onClick={e=>{e.stopPropagation();setPhotoPromptMeal(name);}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+C.border,background:"transparent",color:C.muted,fontFamily:FM,fontSize:seniorMode?16:12,cursor:"pointer"}} title="Add or change photo" disabled={isViewer}>📸 {mealPhotos[name]?"Change Photo":"Add Photo"}</button>
                      {!isViewer&&<button onClick={e=>{e.stopPropagation();
                        if(!familyRecipes.find(r=>r.name===name)){
                          const rData=recipeRatings[name];
                          setFamilyRecipes(p=>[...p,{id:Date.now()+Math.random(),name,...(rData?.recipe||{}),isFamilyRecipe:true}]);
                          alert(name+" moved to Family Recipes!");
                        } else { alert(name+" is already in Family Recipes."); }
                      }} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #b45309",background:"transparent",color:"#b45309",fontFamily:FM,fontSize:seniorMode?16:12,cursor:"pointer"}}>📖 Add to Family</button>}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

            {/* == REJECTED MEALS == */}
            {(()=>{
              const ratings=JSON.parse(localStorage.getItem("sk_recipeRatings")||"{}");
              const changed=JSON.parse(localStorage.getItem("sk_changeMealHistory")||"[]");
              const banned1star=Object.entries(ratings).filter(([,v])=>v?.rating===1).map(([name])=>({name,reason:"1-star rating"}));
              const rejCounts={};
              changed.forEach(c=>{if(c.meal){rejCounts[c.meal]=(rejCounts[c.meal]||0)+1;}});
              const bannedSkipped=Object.entries(rejCounts).filter(([,c])=>c>=2).map(([name,c])=>({name,reason:"Skipped "+c+"x"}));
              const allBanned=[...banned1star,...bannedSkipped.filter(b=>!banned1star.find(s=>s.name===b.name))];
              if(!allBanned.length) return null;
              return(
                <div style={{marginTop:24}}>
                  <div style={{fontFamily:FM,fontSize:11,color:C.red,letterSpacing:0.8,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                    <span>🚫</span><span>REJECTED MEALS</span>
                    <span style={{fontSize:10,color:C.muted,fontWeight:400,marginLeft:4}}>{showRejected?"Tap Restore to add back to suggestions":"Hidden"}</span>
                    <div style={{marginLeft:"auto",display:"flex",gap:6}}>{!showRejected&&<button onClick={()=>setShowRejected(true)} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:6,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:FM}}>▼ Show</button>}<button onClick={()=>{try{localStorage.setItem("sk_changeMealHistory","[]");const ratings=JSON.parse(localStorage.getItem("sk_recipeRatings")||"{}");const cleared=Object.fromEntries(Object.entries(ratings).filter(([,v])=>v?.rating!==1));localStorage.setItem("sk_recipeRatings",JSON.stringify(cleared));}catch{}setShowRejected(false);}} style={{background:"#2a1515",border:"1px solid #dc2626",borderRadius:6,color:"#dc2626",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:FM}}>✕ Dismiss All</button></div>
                  </div>
                  {showRejected&&allBanned.map(({name,reason})=>(
                    <div key={name} style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                      <div>
                        <div style={{fontSize:seniorMode?17:13,fontWeight:600,color:C.text}}>{name}</div>
                        <div style={{fontSize:seniorMode?14:11,color:C.muted,marginTop:2}}>{reason}</div>
                      </div>
                      <button onClick={()=>{
                        try{
                          const r=JSON.parse(localStorage.getItem("sk_recipeRatings")||"{}");
                          if(r[name]?.rating===1){delete r[name];localStorage.setItem("sk_recipeRatings",JSON.stringify(r));setRecipeRatings(r);}
                          const ch=JSON.parse(localStorage.getItem("sk_changeMealHistory")||"[]");
                          const filtered=ch.filter(c=>c.meal!==name);
                          localStorage.setItem("sk_changeMealHistory",JSON.stringify(filtered));
                        }catch{}
                      }} style={{background:"#1a2e1a",border:"1px solid #4c4",borderRadius:8,color:"#4c4",cursor:"pointer",fontSize:seniorMode?15:12,padding:seniorMode?"6px 16px":"4px 12px",whiteSpace:"nowrap",flexShrink:0}}>
                        ↩ Restore
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}

{/* == MEAL PLAN == */}
        {!loading&&tab==="mealplan"&&(
          <div>
            {saleItems.length>0&&(
              <div style={{background:"#1a1500",border:"1px solid #f59e0b",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontFamily:FD,fontSize:14,color:"#f59e0b"}}>🏷 {saleItems.length} Meijer Sale Items Loaded</div>
                  <div style={{fontFamily:FM,fontSize:11,color:"#fbbf24",marginTop:2}}>{saleItems.slice(0,4).map(i=>i.name).join(", ")}{saleItems.length>4?" + "+(saleItems.length-4)+" more":""}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{...bBtn("ghost"),fontSize:11,padding:"6px 12px",border:"1px solid #f59e0b44",color:"#f59e0b"}} onClick={()=>setSaleItems([])}>✕ Clear</button>
                  <button style={{padding:"8px 16px",borderRadius:9,border:"none",background:"#f59e0b",color:"#0c0e14",fontFamily:FM,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={buildSaleMealPlan}>🏷 Build Sale Meal Plan</button>
                </div>
              </div>
            )}
            {(()=>{const tod=new Date();return activeProfiles.filter(p=>p.dob).find(p=>{const b=new Date(p.dob+"T12:00:00");const nb=new Date(tod.getFullYear(),b.getMonth(),b.getDate());if(nb<tod) nb.setFullYear(tod.getFullYear()+1);return Math.ceil((nb-tod)/(1000*60*60*24))<=7;});})()&&(()=>{const tod=new Date();const bPerson=activeProfiles.filter(p=>p.dob).find(p=>{const b=new Date(p.dob+"T12:00:00");const nb=new Date(tod.getFullYear(),b.getMonth(),b.getDate());if(nb<tod) nb.setFullYear(tod.getFullYear()+1);return Math.ceil((nb-tod)/(1000*60*60*24))<=7;});const b2=new Date(bPerson.dob+"T12:00:00");const nb2=new Date(tod.getFullYear(),b2.getMonth(),b2.getDate());if(nb2<tod) nb2.setFullYear(tod.getFullYear()+1);const days=Math.ceil((nb2-tod)/(1000*60*60*24));return <div style={{background:"#f59e0b22",border:"1px solid #f59e0b44",borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>{setShowOccasionPlanner(true);setOccasionState(s=>({...s,eventType:"party",audienceType:"family"}));setOccasionStep("form");}}><span style={{fontSize:20}}>🎂</span><div><div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:"#d97706"}}>{bPerson.name||"Someone"} has a birthday in {days} day{days===1?"":"s"}!</div><div style={{fontFamily:FM,fontSize:11,color:C.muted}}>Tap to plan a birthday dinner.</div></div></div>;})()}
            {occasionState.eventType&&<div style={{background:C.accent+"18",border:"1px solid "+C.accent+"44",borderRadius:10,padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:16}}>{OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType)?.emoji||""}</span>
              <span style={{fontFamily:FM,fontSize:12,color:C.accent,fontWeight:600}}>{OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType)?.label} · {OCCASION_AUDIENCE_TYPES.find(a=>a.key===occasionState.audienceType)?.label}{occasionState.headCount?" · "+occasionState.headCount+" people":""}</span>
              <button onClick={()=>setOccasionState({eventType:"",audienceType:"family",headCount:"",mode:"use",budget:"",guestRestrictions:"",note:"",includeDrinks:false})} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12,marginLeft:"auto"}}>✕ Clear</button>
            </div>}
            {can.medicalCompliance&&user?.id&&(<NutritionDashboard familyProfiles={familyProfiles} user={user} supabase={supabase} seniorMode={seniorMode} C={C} FM={FM} FD={FD} refreshKey={dashRefreshKey}/>)}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <div style={{fontFamily:FD,fontSize:24}}>7-Day Dinner Plan <span style={{fontSize:13,color:C.muted,fontFamily:FB}}>· {activeProfiles.length} people</span></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button style={bBtn("ghost")} onClick={buildMealPlan} disabled={isViewer}>🔄 Regenerate</button>
                <button style={{...bBtn("ghost"),border:"1px solid "+C.accent,color:C.accent}} onClick={()=>setShowOccasionPlanner(true)}>🎉 Plan Occasion</button>
                {mealPlan.length>0&&<><button style={bBtn("ghost")} onClick={printMealPlan}>🖨 Print</button><button style={bBtn("ghost")} onClick={pushToCalendar}>📅 Calendar</button><button style={bBtn("primary")} onClick={genShopping}>🛒 Shopping List</button></>}
              </div>
            </div>
            {mealPlan.length===0?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{fontFamily:FD,fontSize:48,color:C.accent,marginBottom:16}}>📅</div>
                <div style={{color:C.muted,marginBottom:20}}>Builds around your protein portions and sauté blend bags</div>
                <button style={{...bBtn("primary"),padding:seniorMode?"18px 36px":"10px 24px",fontSize:seniorMode?20:13}} onClick={buildMealPlan} disabled={isViewer}>📅 Build Meal Plan</button>
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
                    <div key={i} style={{background:C.card,border:"1px solid "+(day.quickMeal?"#f59e0b":C.border),borderRadius:seniorMode?16:12,padding:seniorMode?18:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{fontWeight:700,color:C.accent,fontSize:seniorMode?30:20,fontFamily:FD}}>{day.day}</div>
                          <div style={{fontFamily:FM,fontSize:9,color:C.muted}}>DAY {i+1}</div>
                        </div>
                        <button onClick={()=>day.quickMeal?clearQuickMeal(i):quickMealForDay(i)} disabled={isViewer} style={{background:day.quickMeal?"#f59e0b22":"transparent",border:"1px solid "+(day.quickMeal?"#f59e0b":C.border),borderRadius:6,color:day.quickMeal?"#f59e0b":C.muted,cursor:"pointer",fontFamily:FM,fontSize:seniorMode?14:10,padding:seniorMode?"6px 14px":"3px 8px"}}>{day.quickMeal?"⚡ Busy Night":"⚡ Busy?"}</button>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        {day.quickMeal&&<span style={{fontSize:10,background:"#f59e0b22",color:"#f59e0b",padding:"2px 6px",borderRadius:4,fontFamily:FM,display:"inline-block",marginBottom:4}}>⚡ BUSY NIGHT — under 20 min</span>}
                        {day.isOccasion&&<span style={{fontSize:10,background:C.accent+"22",color:C.accent,padding:"2px 8px",borderRadius:4,fontFamily:FM,display:"inline-block",marginBottom:4,fontWeight:600}}>{day.occasionLabel||"Occasion"}</span>}
                        {mealPhotos[day.meal]&&<div style={{marginBottom:6}}><img src={mealPhotos[day.meal]} alt={day.meal} style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:8,border:"1px solid "+C.borderLight}} /></div>}
                        {restrictedProfiles.length>0&&(()=>{
                          const badges=restrictedProfiles.map(p=>{
                            const r=RESTRICTION_PRESETS[p.restriction];
                            if(!r||p.restriction==="standard"||p.restriction==="none") return null;
                            const name=p.name||(r.label);
                            const hints=[];
                            if(p.restriction==="diabetic"||p.restriction==="diabeticRenal") hints.push("low-carb");
                            if(p.restriction==="senior") hints.push("senior-friendly");
                            if(p.restriction==="renal"||p.restriction==="diabeticRenal") hints.push("kidney-safe");
                            if(p.restriction==="heartHealthy") hints.push("heart-healthy");
                            if(p.restriction==="lowSodium") hints.push("low-sodium");
                            if(p.restriction==="athlete") hints.push("high-protein");
                            return (
                              <span key={p.id} style={{fontSize:10,background:r.color+"22",color:r.color,padding:"2px 7px",borderRadius:4,fontFamily:FM,display:"inline-flex",alignItems:"center",gap:3,marginBottom:4,border:"1px solid "+r.color+"44"}}>
                                {r.icon} {name}{hints.length>0?" · "+hints[0]:""}
                              </span>
                            );
                          }).filter(Boolean);
                          return badges.length>0?<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>{badges}</div>:null;
                        })()}
                        {(()=>{const warns=getMedicalWarnings(day.meal);if(!warns.length)return null;const strictBlocks=warns.filter(w=>w.enforcement==="strict");const warnFlags=warns.filter(w=>w.enforcement==="warn");return(<div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:4}}>{strictBlocks.map((w,i)=>(<span key={"s"+i} style={{fontSize:10,background:"#dc2626",color:"#fff",padding:"3px 8px",borderRadius:4,fontFamily:FM,display:"flex",alignItems:"center",gap:4,border:"1px solid #991b1b"}}>🚫 <strong>{w.member}:</strong> {w.msg}</span>))}{warnFlags.map((w,i)=>(<span key={"w"+i} style={{fontSize:10,background:"#d97706",color:"#fff",padding:"3px 8px",borderRadius:4,fontFamily:FM,display:"flex",alignItems:"center",gap:4,border:"1px solid #b45309"}}>⚠ <strong>{w.member}:</strong> {w.msg}</span>))}</div>);})()}
                        <div><div onClick={()=>openMealPlanRecipe(day)} style={{fontFamily:FD,fontSize:seniorMode?26:19,marginBottom:4,color:C.accent,cursor:"pointer",lineHeight:1.4}}>🔍 {day.meal}</div>
                        {/* Star rating on meal plan card */}
                        <div style={{display:"flex",gap:3,marginBottom:6}} onClick={e=>e.stopPropagation()}>
                          {[1,2,3,4,5].map(star=>{
                            const mealRating=recipeRatings[day.meal]?.rating||0;
                            return <button key={star} onClick={e=>{e.stopPropagation();setRecipeRatings(prev=>{const cur=prev[day.meal]?.rating||0;const next={...prev};if(cur===star){delete next[day.meal];}else{next[day.meal]={rating:star,recipe:{name:day.meal,description:"",time:"",difficulty:"Easy",usesFromInventory:day.ingredients||[],missingIngredients:day.shoppingNeeded?.map(s=>s.name)||[]}};}if(star===5&&cur!==5){const skips=parseInt(localStorage.getItem("sk_photoSkipCount")||"0");if(skips<3) setTimeout(()=>setPhotoPromptMeal(day.meal),300);}return next;});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:seniorMode?20:16,padding:"0 1px",color:star<=mealRating?"#f59e0b":"#555"}} title={star===1?"Never suggest again":star===5?"Keeper!":"Rate "+star+" stars"}>{star<=mealRating?"★":"☆"}</button>;
                          })}
                          {(recipeRatings[day.meal]?.rating||0)>=3&&<span style={{fontSize:9,color:C.muted,fontFamily:FM,marginLeft:3,alignSelf:"center"}}>{recipeRatings[day.meal]?.rating===5?"🏆":recipeRatings[day.meal]?.rating===4?"❤":"👍"}</span>}
                        </div>
                        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:day.ingredients&&day.ingredients.length>0?6:0}}><span onClick={()=>openMealPlanRecipe(day)} style={{fontSize:seniorMode?18:13,color:"#f59e0b",fontFamily:FM,cursor:"pointer",letterSpacing:0.3,fontWeight:700,whiteSpace:"nowrap"}}>TAP FOR FULL RECIPE →</span><a href={getRecipeUrl(day.meal)} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#60a5fa",fontFamily:FM,textDecoration:"none",fontWeight:600}}>🌐 web</a></div>{day.ingredients&&day.ingredients.length>0&&(()=>{const maxShow=3;const expanded=expandedIngDay===i;const shown=expanded?day.ingredients:day.ingredients.slice(0,maxShow);return <div style={{marginTop:6,padding:"8px 10px",background:"rgba(255,255,255,0.05)",borderRadius:6,fontSize:11,fontFamily:FM}}><div style={{fontWeight:600,marginBottom:4,color:C.muted,fontSize:seniorMode?13:10}}>INGREDIENTS</div>{shown.map((ing,ii)=><div key={ii} style={{color:C.text,marginBottom:seniorMode?4:2,fontSize:seniorMode?15:11}}>· {ing}</div>)}{day.ingredients.length>maxShow&&<button onClick={e=>{e.stopPropagation();setExpandedIngDay(expanded?null:i);}} style={{background:"transparent",border:"none",color:C.accent,fontFamily:FM,fontSize:seniorMode?14:11,cursor:"pointer",padding:"4px 0",fontWeight:600}}>{expanded?"▲ Show less":"▼ Show all "+day.ingredients.length+" ingredients"}</button>}</div>;})()}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {day.proteinUsed&&<span style={bTag(PROTEIN_TAG_COLOR(day.proteinUsed))}>🥩 {day.proteinUsed}</span>}
                          {(day.sauteBagsUsed||0)>0&&<span style={bTag(C.orange)}>🫕 {day.sauteBagsUsed} bag</span>}
                          {day.sideUsed&&<span style={bTag(C.green)}>🥦 {day.sideUsed}</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        {(day.shoppingNeeded||[]).length===0
                          ?<span style={bTag(C.green)}>✅ Ready</span>
                          :<div style={{width:"100%",marginBottom:4}}><div style={{fontSize:9,color:C.muted,marginBottom:3,fontFamily:FM}}>NEED</div>{(day.shoppingNeeded||[]).map((s,j)=><div key={j} style={{fontSize:seniorMode?15:13,color:C.red,marginBottom:2}}>· {s.qty} {s.unit} {s.name}</div>)}</div>}
                        <button onClick={()=>madeMeal(day)} style={{background:"#3ecf8e22",border:"1px solid #3ecf8e44",borderRadius:seniorMode?10:6,color:"#3ecf8e",cursor:"pointer",fontFamily:FM,fontSize:seniorMode?18:11,padding:seniorMode?"12px 20px":"8px 14px",flexShrink:0,fontWeight:seniorMode?700:400}} disabled={isViewer}>✅ Made It!</button>
                        {familyProfiles.some(p=>p.guidedPlateMode)&&(<button onClick={()=>{const qualifying=familyProfiles.filter(p=>p.guidedPlateMode||p.medicalPlan||(can.medicalCompliance&&p.medicalAllergies?.length>0));const active=qualifying.length>0?qualifying:familyProfiles.slice(0,1);setPlateStep(0);setPlateComponents([]);setPlateCumulativeG(0);setPlateSessionId(Date.now().toString());setPlateCoachNote("");setShowPlateSummary(false);setScaleCalcResult(null);setScaleError("");setPlateSuggestedComponents([]);setPlateCurrentComponentIdx(-1);setPlateComponentsLoading(true);if(active.length===1){const activeP=active[0];setPlateSession({active:true,memberName:activeP.name||"",mealName:day.meal,mealDay:day.day,activeProfile:activeP,dayObj:day});setPlatePendingMeal(null);setPlateQualifyingMembers([]);}else{setPlatePendingMeal(day);setPlateQualifyingMembers(active);setPlateSession({active:true,memberName:"",mealName:day.meal,mealDay:day.day,activeProfile:null,dayObj:day});}setShowScaleModal(true);buildComponentsFromDay(day).then(comps=>{setPlateSuggestedComponents(comps);setPlateComponentsLoading(false);}).catch(()=>setPlateComponentsLoading(false));}} style={{background:"#10b98122",border:"1px solid #10b981",borderRadius:seniorMode?10:6,color:"#10b981",cursor:"pointer",fontFamily:FM,fontSize:seniorMode?16:11,padding:seniorMode?"10px 16px":"6px 12px",flexShrink:0,fontWeight:600}} disabled={isViewer}>🍽 Build Plate</button>)}
                        <button onClick={()=>setPhotoPromptMeal(day.meal)} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:seniorMode?10:6,color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:seniorMode?16:12,padding:seniorMode?"10px 14px":"8px 12px",flexShrink:0}} title="Add photo" disabled={isViewer}>📸 {mealPhotos[day.meal]?"Change":"Photo"}</button>
                        <button onClick={()=>{setChangeMealModal(i);setChangeMealRequest("");}} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:seniorMode?10:4,color:C.muted,fontFamily:FM,fontSize:seniorMode?18:11,padding:seniorMode?"12px 20px":"8px 14px",cursor:"pointer",flexShrink:0}} disabled={isViewer}>🔄 Change Meal</button>
                        <button onClick={()=>{setShowOccasionPlanner(true);setOccasionStep("form");setOccasionResult(null);setOccasionDate("");}} style={{background:"transparent",border:"1px solid "+C.accent,borderRadius:seniorMode?10:4,color:C.accent,fontFamily:FM,fontSize:seniorMode?18:11,padding:seniorMode?"12px 20px":"8px 14px",cursor:"pointer",flexShrink:0}}>🎉 Occasion</button>
                        <button onClick={()=>{setPairDrinkMeal(day);setPairDrinkResult(null);setPairDrinkCellar(null);setPairDrinkCellarLoading(false);}} style={{background:"transparent",border:"1px solid #7c3aed44",borderRadius:seniorMode?10:4,color:"#7c3aed",fontFamily:FM,fontSize:seniorMode?18:11,padding:seniorMode?"12px 20px":"8px 14px",cursor:"pointer",flexShrink:0}}>🍷 Pair a Drink</button>
                        <button onClick={()=>{const today=new Date();const daysToMon=today.getDay()===0?1:8-today.getDay();const monday=new Date(today);monday.setDate(today.getDate()+daysToMon);const offsets={Monday:0,Tuesday:1,Wednesday:2,Thursday:3,Friday:4,Saturday:5,Sunday:6};const d=new Date(monday);d.setDate(monday.getDate()+(offsets[day.day]??0));const dateStr=d.toISOString().split("T")[0].replace(/-/g,"");const desc=[day.proteinUsed?"Protein: "+day.proteinUsed:"",day.sideUsed?"Side: "+day.sideUsed:"",(day.shoppingNeeded||[]).length>0?"Need: "+day.shoppingNeeded.map(s=>s.name).join(", "):"All on hand"].filter(Boolean).join(" | ");window.open("https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent("Dinner: "+day.meal)+"&dates="+dateStr+"/"+dateStr+"&details="+encodeURIComponent(desc),"_blank");}} style={{background:"transparent",border:"1px solid #5b9cf6",borderRadius:4,color:"#5b9cf6",fontFamily:FM,fontSize:seniorMode?14:11,padding:"8px 14px",cursor:"pointer",flexShrink:0}} disabled={isViewer}>📅 Add to Calendar</button>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showMadeItModal&&madeItDay&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowMadeItModal(false)}><div style={{background:C.card,borderRadius:"18px 18px 0 0",padding:20,width:"100%",maxWidth:600,maxHeight:"82vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontFamily:FD,fontSize:seniorMode?24:18,color:C.accent}}>What did you make?</div><button onClick={()=>setShowMadeItModal(false)} style={{background:"transparent",border:"none",color:C.muted,fontSize:22,cursor:"pointer"}}>X</button></div><div style={{fontFamily:FM,fontSize:11,color:C.muted,letterSpacing:0.8,marginBottom:8}}>PLANNED DISH</div><div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.accent+"15",border:"1px solid "+C.accent,borderRadius:10,marginBottom:16}}><span style={{fontSize:18}}>&#x2705;</span><span style={{fontFamily:FD,fontSize:seniorMode?18:15,color:C.text,fontWeight:600}}>{madeItDay.meal}</span></div><div style={{fontFamily:FM,fontSize:11,color:C.muted,letterSpacing:0.8,marginBottom:8}}>SIDES & ADDITIONS</div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{inventory.filter(item=>{if(!["Produce","Frozen","Grains","Wild Harvest","Home Harvest"].includes(item.category))return false;if(item.qty<=0)return false;const n=item.name.toLowerCase();const exclude=["cereal","oat","granola","pastry","toaster","pop tart","muffin","pancake","waffle","baking","flour","sugar","salt","pepper","powder","starch","seasoning","sauce","ketchup","mustard","mayo","syrup","honey","jam","jelly","oil","vinegar","broth","stock","coffee","tea","juice","soda","drink","water","milk","cream","butter","egg","cheese","cracker","chip","pretzel","cookie","candy","chocolate","snack","bar","banana","apple","orange","grape","strawberr","blueberr","raspberry","peach","pear","mango","pineapple","melon","watermelon","cherry","plum","kiwi","lemon","lime","meal kit","meal","alfredo meal","helper","hamburger helper","skillet"];// Also skip if this item name appears in the planned meal name
const mealLower=(madeItDay?.meal||"").toLowerCase();if(n.split(" ").some(word=>word.length>3&&mealLower.includes(word)))return false;return !exclude.some(x=>n.includes(x));}).slice(0,16).map(item=>{const on=madeItSides.includes(item.name);return(<button key={item.name} onClick={()=>setMadeItSides(prev=>on?prev.filter(s=>s!==item.name):[...prev,item.name])} style={{padding:"6px 12px",borderRadius:16,border:"1px solid "+(on?C.accent:C.border),background:on?C.accent+"22":"transparent",color:on?C.accent:C.text,fontFamily:FM,fontSize:seniorMode?14:11,cursor:"pointer"}}>{on?"✓ ":""}{item.name}</button>);})}</div><div style={{display:"flex",gap:8,marginBottom:16}}><input value={madeItSideInput} onChange={e=>setMadeItSideInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&madeItSideInput.trim()){setMadeItSides(prev=>[...prev,madeItSideInput.trim()]);setMadeItSideInput("");}}} placeholder="Add anything else... (e.g. Corn, Dinner Rolls)" style={{flex:1,background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"8px 12px",color:C.text,fontFamily:FM,fontSize:12,outline:"none"}}/><button onClick={()=>{if(madeItSideInput.trim()){setMadeItSides(prev=>[...prev,madeItSideInput.trim()]);setMadeItSideInput("");}}} style={{...bBtn("primary"),padding:"8px 14px",fontSize:12}}>+ Add</button></div>{madeItSides.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{madeItSides.map(s=>(<div key={s} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:14,background:C.green+"22",border:"1px solid "+C.green,color:C.green,fontFamily:FM,fontSize:11}}><span>{s}</span><span style={{cursor:"pointer",fontWeight:700}} onClick={()=>setMadeItSides(prev=>prev.filter(x=>x!==s))}>x</span></div>))}</div>}{(madeItDay.proteinUsed||madeItDay.sideUsed)&&<div><div style={{fontFamily:FM,fontSize:11,color:C.muted,letterSpacing:0.8,marginBottom:8}}>SUBSTITUTIONS (optional)</div><div style={{fontSize:12,color:C.muted,fontFamily:FM,marginBottom:8}}>Did you swap any planned ingredient?</div>{madeItDay.proteinUsed&&<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><span style={{fontFamily:FM,fontSize:12,color:C.text,minWidth:100}}>{madeItDay.proteinUsed}</span><span style={{color:C.muted,fontSize:12}}>→</span><input value={madeItSubs[madeItDay.proteinUsed]||""} onChange={e=>setMadeItSubs(prev=>({...prev,[madeItDay.proteinUsed]:e.target.value}))} placeholder="Used instead..." style={{flex:1,background:C.surface,border:"1px solid "+C.border,borderRadius:6,padding:"6px 10px",color:C.text,fontFamily:FM,fontSize:11,outline:"none"}}/></div>}</div>}<button onClick={()=>confirmMadeIt(madeItDay,madeItSides,madeItSubs)} style={{...bBtn("primary"),width:"100%",padding:14,fontSize:seniorMode?18:14,marginTop:8}}>🎉 That's what we made!</button><div style={{fontFamily:FM,fontSize:10,color:C.muted,textAlign:"center",marginTop:8}}>Inventory will be updated for everything logged above.</div></div></div>}{pairDrinkMeal&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:C.card,borderRadius:16,padding:24,maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}><div><div style={{fontFamily:FD,fontSize:22,color:"#7c3aed",fontWeight:700,marginBottom:4}}>🍷 Pair a Drink</div><div style={{fontFamily:FM,fontSize:12,color:C.muted}}>{pairDrinkMeal.meal}</div></div><button onClick={()=>{setPairDrinkMeal(null);setPairDrinkResult(null);setPairDrinkLoading(false);setPairDrinkCellar(null);setPairDrinkCellarLoading(false);setPairDrinkMarkedBottle(null);setPairDrinkMarkStatus(null);}} style={{background:"transparent",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>X</button></div>{/* Smart Cellar live inventory pull */}
<div style={{marginBottom:14}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
    <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text}}>
      🍾 Smart Cellar Inventory
    </div>
    <button
      onClick={async()=>{
        if(!user){setPairDrinkCellar({error:"Sign in to sync your Smart Cellar inventory."});return;}
        setPairDrinkCellarLoading(true);
        try{
          const {data}=await supabase.from("profiles").select("sc_cloud_data").eq("id",user.id).single();
          if(data?.sc_cloud_data){
            const parsed=typeof data.sc_cloud_data==="string"?JSON.parse(data.sc_cloud_data):data.sc_cloud_data;
            const bottles=(parsed.cellar||[]).filter(b=>(b.remaining_pct??100)>5);
            setPairDrinkCellar(bottles);
          }else{
            setPairDrinkCellar([]);
          }
        }catch(e){
          setPairDrinkCellar({error:"Could not load cellar. Make sure you are signed in to Smart Cellar."});
        }
        setPairDrinkCellarLoading(false);
      }}
      style={{background:"#7c3aed22",border:"1px solid #7c3aed66",borderRadius:8,color:"#7c3aed",fontFamily:FM,fontSize:11,fontWeight:700,padding:"5px 12px",cursor:"pointer"}}>
      {pairDrinkCellarLoading?"Loading…":"⟳ Pull from Smart Cellar"}
    </button>
  </div>
  {/* Not loaded yet */}
  {!pairDrinkCellar&&(
    <div style={{background:C.surface,border:"1px dashed #7c3aed44",borderRadius:8,padding:"14px 12px",fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.6,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:6}}>🍷</div>
      <div style={{fontWeight:700,color:"#7c3aed",fontSize:13,marginBottom:4}}>Pair from Your Smart Cellar</div>
      <div style={{marginBottom:10}}>Tap <strong style={{color:"#7c3aed"}}>Pull from Smart Cellar</strong> to see which bottles you have that pair with this meal.</div>
      <div style={{borderTop:"1px solid #7c3aed22",paddingTop:10,marginTop:2}}>
        <div style={{fontWeight:600,color:"#7c3aed",marginBottom:3}}>New to Smart Cellar?</div>
        <div style={{marginBottom:8}}>Track your wine, spirits, and beer inventory and get AI pairings from what you actually have on hand.</div>
        <a href="https://smart-cellar-rho.vercel.app" target="_blank" rel="noopener noreferrer"
          style={{display:"inline-block",background:"#7c3aed",color:"#fff",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:12,textDecoration:"none"}}>
          🍾 Try Smart Cellar Free — 30 Days
        </a>
      </div>
    </div>
  )}
  {/* Error */}
  {pairDrinkCellar?.error&&(
    <div style={{background:"#dc262612",border:"1px solid #dc262644",borderRadius:8,padding:"10px 12px",fontFamily:FM,fontSize:11,color:"#dc2626"}}>
      {pairDrinkCellar.error}
    </div>
  )}
  {/* Empty cellar */}
  {Array.isArray(pairDrinkCellar)&&pairDrinkCellar.length===0&&(
    <div style={{background:C.surface,border:"1px solid #7c3aed44",borderRadius:8,padding:"10px 12px",fontFamily:FM,fontSize:11,color:C.muted}}>
      <div style={{fontWeight:700,color:"#7c3aed",marginBottom:4}}>🍾 Your Smart Cellar is empty</div>
      <div style={{marginBottom:10}}>Add your wine, spirits, and beer bottles to get AI pairings from what you actually have on hand.</div>
      <a href="https://smart-cellar-rho.vercel.app" target="_blank" rel="noopener noreferrer"
        style={{display:"inline-block",background:"#7c3aed",color:"#fff",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:12,textDecoration:"none",marginBottom:6}}>
        🍾 Add Bottles to Smart Cellar
      </a>
      <div style={{fontSize:10,color:C.muted,marginTop:4}}>smart-cellar-rho.vercel.app — 30-day free trial — same login as Smart Kitchen</div>
    </div>
  )}
  {/* Loaded bottles */}
  {Array.isArray(pairDrinkCellar)&&pairDrinkCellar.length>0&&(
    <div style={{background:C.surface,border:"1px solid #7c3aed44",borderRadius:8,padding:"10px 12px",maxHeight:140,overflowY:"auto"}}>
      <div style={{fontFamily:FM,fontSize:10,color:"#7c3aed",fontWeight:700,marginBottom:6}}>
        {pairDrinkCellar.length} BOTTLE{pairDrinkCellar.length!==1?"S":""} IN CELLAR
      </div>
      {pairDrinkCellar.map((b,i)=>(
        <div key={i} style={{fontFamily:FM,fontSize:11,color:C.text,padding:"3px 0",borderBottom:i<pairDrinkCellar.length-1?"1px solid "+C.border:"none",display:"flex",justifyContent:"space-between",gap:8}}>
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.name}</span>
          <span style={{color:C.muted,flexShrink:0,fontSize:10}}>{b.category}</span>
        </div>
      ))}
    </div>
  )}
</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}><div style={{fontFamily:FM,fontSize:11,color:C.muted,width:"100%",marginBottom:2}}>Preference (optional)</div>{["Wine","Beer","Spirits","Non-Alcoholic"].map(p=><button key={p} id={"pref-"+p} onClick={()=>{document.querySelectorAll("[id^=pref-]").forEach(b=>b.style.background="transparent");document.getElementById("pref-"+p).style.background="#7c3aed22";}} style={{background:"transparent",border:"1px solid #7c3aed44",borderRadius:20,color:"#7c3aed",fontFamily:FM,fontSize:11,padding:"5px 12px",cursor:"pointer"}}>{p}</button>)}</div><button onClick={async()=>{const inv=Array.isArray(pairDrinkCellar)&&pairDrinkCellar.length>0
  ?pairDrinkCellar.map(b=>`${b.name} (${b.category}${b.remaining_pct?", "+Math.round(b.remaining_pct)+"% remaining":""}${b.sweetness?", "+b.sweetness:""}${b.vintage?", "+b.vintage:""})`).join("\n")
  :"";
const pref=[..."Wine","Beer","Spirits","Non-Alcoholic"].find(p=>document.getElementById("pref-"+p)?.style.background.includes("7c3aed22"))||"";setPairDrinkLoading(true);setPairDrinkResult(null);try{const resp=await callClaude({system:"You are a knowledgeable sommelier and beverage pairing expert. The user will give you a meal name, optional cellar inventory, and an optional preference. Your response has two parts: (1) Recommend the best pairing from their inventory if provided. Lead with the bottle name, then 2-3 sentences on why it works with this specific meal. If nothing fits well, say so honestly and suggest what to look for. (2) If the cellar inventory leans heavily toward one style (e.g. all sweet wines), briefly note what wine styles or spirits would complement this type of cooking and be worth adding. Keep part 2 to 2-3 sentences. Be warm, specific, and genuinely helpful — like a friend who knows wine.",prompt:"Meal: "+pairDrinkMeal.meal+(pairDrinkMeal.proteinUsed?". Protein: "+pairDrinkMeal.proteinUsed:"")+(pairDrinkMeal.sideUsed?". Side: "+pairDrinkMeal.sideUsed:"")+(inv?"\n\nCellar inventory:\n"+inv:"\n\nNo inventory provided — suggest a style.")+(pref?"\n\nPreference: "+pref:""),maxTokens:500});const rawResp=typeof resp==="string"?resp:resp?.content?.[0]?.text||"No recommendation returned.";setPairDrinkResult(rawResp.replace(/[*][*]([^*]+)[*][*]/g,"$1"));}catch(e){setPairDrinkResult("Unable to get recommendation. Please try again.");}finally{setPairDrinkLoading(false);}}} disabled={pairDrinkLoading} style={{width:"100%",background:pairDrinkLoading?"#7c3aed44":"#7c3aed",border:"none",borderRadius:10,color:"#fff",fontFamily:FM,fontWeight:700,fontSize:seniorMode?16:13,padding:seniorMode?"14px":"11px 16px",cursor:pairDrinkLoading?"not-allowed":"pointer",marginBottom:14}}>{pairDrinkLoading?"⏳ Finding your pairing...":"🍷 Get Pairing Recommendation"}</button>{pairDrinkResult&&<div><div style={{background:"#7c3aed11",border:"1px solid #7c3aed33",borderRadius:10,padding:16,fontFamily:FM,fontSize:seniorMode?15:13,color:C.text,lineHeight:1.6,whiteSpace:"pre-wrap",marginBottom:14}}>{pairDrinkResult}</div>{Array.isArray(pairDrinkCellar)&&pairDrinkCellar.length>0&&(<div style={{background:C.surface,border:"1px solid #7c3aed33",borderRadius:10,padding:"12px 14px"}}><div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:"#7c3aed",marginBottom:8}}>MARK AS USED</div><div style={{fontFamily:FM,fontSize:11,color:C.muted,marginBottom:10}}>Which bottle did you open? We'll update your Smart Cellar inventory.</div><div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:120,overflowY:"auto",marginBottom:10}}>{pairDrinkCellar.map((b,i)=>(<button key={i} onClick={()=>setPairDrinkMarkedBottle(pairDrinkMarkedBottle?.id===b.id?null:b)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderRadius:8,cursor:"pointer",fontFamily:FM,fontSize:12,border:"1px solid "+(pairDrinkMarkedBottle?.id===b.id?"#7c3aed":"#7c3aed33"),background:pairDrinkMarkedBottle?.id===b.id?"#7c3aed22":"transparent",color:C.text,textAlign:"left"}}><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{b.name}</span><span style={{color:C.muted,fontSize:10,flexShrink:0,marginLeft:8}}>{Math.round(b.remaining_pct??100)}%</span></button>))}</div><button disabled={!pairDrinkMarkedBottle||pairDrinkMarkStatus==="saving"} onClick={async()=>{if(!pairDrinkMarkedBottle||!user)return;setPairDrinkMarkStatus("saving");try{const {data}=await supabase.from("profiles").select("sc_cloud_data").eq("id",user.id).single();if(data?.sc_cloud_data){const parsed=typeof data.sc_cloud_data==="string"?JSON.parse(data.sc_cloud_data):data.sc_cloud_data;const cat=(pairDrinkMarkedBottle.category||"").toLowerCase();const bottleMl=pairDrinkMarkedBottle.size_ml||750;const pourMl=cat.includes("wine")||cat.includes("sparkling")||cat.includes("ros")?148:cat.includes("beer")||cat.includes("cider")||cat.includes("seltzer")?355:cat.includes("whiskey")||cat.includes("bourbon")||cat.includes("scotch")||cat.includes("rye")||cat.includes("vodka")||cat.includes("gin")||cat.includes("rum")||cat.includes("tequila")||cat.includes("brandy")||cat.includes("spirit")?44:74;const POUR_PCT=Math.round((pourMl/bottleMl)*100);const prevPct=pairDrinkMarkedBottle.remaining_pct??100;const updatedCellar=(parsed.cellar||[]).map(b=>{if(b.id===pairDrinkMarkedBottle.id){const newPct=Math.max(0,(b.remaining_pct??100)-POUR_PCT);return {...b,remaining_pct:newPct};}return b;});await supabase.from("profiles").update({sc_cloud_data:{...parsed,cellar:updatedCellar}}).eq("id",user.id);const updatedBottle=updatedCellar.find(b=>b.id===pairDrinkMarkedBottle.id);const newPct=updatedBottle?.remaining_pct??0;if(prevPct>=75&&newPct<75){const existing=JSON.parse(localStorage.getItem("sk_shoppingList")||"[]");const alreadyOn=existing.some(e=>(e.name||"").toLowerCase()===pairDrinkMarkedBottle.name.toLowerCase());if(!alreadyOn){localStorage.setItem("sk_shoppingList",JSON.stringify([...existing,{name:pairDrinkMarkedBottle.name,checked:false,source:"Smart Cellar — running low"}]));setPairDrinkMarkStatus("listed");}else{setPairDrinkMarkStatus("done");}}else{setPairDrinkMarkStatus("done");}setPairDrinkCellar(updatedCellar.filter(b=>(b.remaining_pct??100)>5));}}catch(e){console.error("Mark as used error:",e);setPairDrinkMarkStatus("error");}}} style={{width:"100%",padding:seniorMode?"12px":"9px 14px",borderRadius:8,border:"none",fontFamily:FM,fontWeight:700,fontSize:seniorMode?15:12,cursor:pairDrinkMarkedBottle&&pairDrinkMarkStatus!=="saving"?"pointer":"not-allowed",background:pairDrinkMarkedBottle?"#7c3aed":"#7c3aed44",color:"#fff",opacity:pairDrinkMarkedBottle?1:0.5}}>{pairDrinkMarkStatus==="saving"?"⏳ Updating cellar…":pairDrinkMarkStatus==="done"?"✓ Cellar Updated!":pairDrinkMarkStatus==="listed"?"✓ Updated + Added to Shopping List!":pairDrinkMarkStatus==="error"?"✕ Could not save — try again":"✓ Mark as Used"}</button>{pairDrinkMarkStatus==="listed"&&<div style={{fontFamily:FM,fontSize:11,color:"#7c3aed",marginTop:8,textAlign:"center"}}>🛒 {pairDrinkMarkedBottle?.name} added to your shopping list.</div>}{pairDrinkMarkStatus==="done"&&<div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:8,textAlign:"center"}}>Smart Cellar updated. Changes sync next time you open Smart Cellar.</div>}</div>)}</div>}</div></div>}

        {changeMealModal!==null&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setChangeMealModal(null)}><div style={{background:C.card,borderRadius:12,padding:24,width:360,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:C.text}}>🔄 Change {mealPlan[changeMealModal]?.day} Meal</div>
          <button onClick={()=>setShowOccasionPlanner(true)} style={{background:"transparent",border:"1px solid "+C.accent,borderRadius:16,color:C.accent,fontFamily:FM,fontSize:11,cursor:"pointer",padding:"5px 10px"}}>🎉 {occasionState.eventType?OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType)?.label:"Occasion"}</button>
        </div><div style={{marginBottom:16}}><button onClick={async()=>{setChangeMealLoading(true);try{const h=JSON.parse(localStorage.getItem("sk_changeMealHistory")||"[]");const d=mealPlan[changeMealModal];if(d){h.push({meal:d.meal,protein:d.proteinUsed||null,day:d.day,ts:Date.now()});localStorage.setItem("sk_changeMealHistory",JSON.stringify(h.slice(-100)));}}catch{} const day=mealPlan[changeMealModal];const prompt=`${buildOccasionContext(occasionState)}Suggest a different dinner meal for ${day.day}. Current meal was: ${day.meal}. INVENTORY (items already owned — do NOT put these in needToBuy): ${inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")}. STRICT RULE: needToBuy must contain ONLY ingredients required for this meal that are NOT in the inventory list above. If an ingredient appears in inventory, it must NOT appear in needToBuy. Cross-check every needToBuy item against inventory before returning. Return JSON: {meal,ingredients:[],needToBuy:[],proteinUsed:"",sauteBagsUsed:0,quickMeal:false}.`;const res=await callClaude({system:"Meal planning AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{console.log("changeMeal res:",JSON.stringify(res));const resText=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||res?.[0]?.text||"";const raw=resText.replace(/```json|```/g,"").trim();console.log("raw:",raw);const s=raw.indexOf("{"),e=raw.lastIndexOf("}");const parsed=JSON.parse(raw.slice(s,e+1));setMealPlan(p=>p.map((d,i)=>i===changeMealModal?{...d,...parsed,needToBuy:parsed.needToBuy||[],shoppingNeeded:(parsed.needToBuy||[]).map(n=>typeof n==="string"?{qty:1,unit:"",name:n}:n),ingredients:parsed.ingredients||[]}:d));setExpandedIngDay(null);setChangeMealModal(null);}catch(err){console.error("Parse error:",err);alert("Could not parse meal suggestion");}setChangeMealLoading(false);}} style={{width:"100%",padding:seniorMode?"14px":"10px",background:C.accent,border:"none",borderRadius:8,color:"#000",fontFamily:FM,fontSize:seniorMode?16:13,fontWeight:600,cursor:"pointer",marginBottom:10}}>✨ {changeMealLoading?"Thinking...":"Surprise Me"}</button><div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:8}}>— or request a specific meal —</div><input style={{width:"100%",padding:"8px",background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box",marginBottom:10}} placeholder='e.g. "Goulash"' value={changeMealRequest} onChange={e=>setChangeMealRequest(e.target.value)} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} /><button onClick={async()=>{if(!changeMealRequest.trim())return;setChangeMealLoading(true);try{const h=JSON.parse(localStorage.getItem("sk_changeMealHistory")||"[]");const d=mealPlan[changeMealModal];if(d){h.push({meal:d.meal,protein:d.proteinUsed||null,day:d.day,ts:Date.now()});localStorage.setItem("sk_changeMealHistory",JSON.stringify(h.slice(-100)));}}catch{} const day=mealPlan[changeMealModal];const prompt=`Create a dinner meal for ${day.day} using "${changeMealRequest}". INVENTORY (items already owned — do NOT put these in needToBuy): ${inventory.map(i=>String(i.name||"")).filter(Boolean).join(", ")}. STRICT RULE: needToBuy must contain ONLY ingredients required for this meal that are NOT in the inventory list above. If an ingredient appears in inventory, it must NOT appear in needToBuy. Cross-check every needToBuy item against inventory before returning. Return JSON: {meal,ingredients:[],needToBuy:[],proteinUsed:"",sauteBagsUsed:0,quickMeal:false}.`;const res=await callClaude({system:"Meal planning AI. Return ONLY valid JSON, no markdown.",prompt,maxTokens:600});try{const resText3=typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.content?.[0]?.text||res?.[0]?.text||"";const raw=resText3;const s=raw.indexOf("{"),e=raw.lastIndexOf("}");const parsed=JSON.parse(raw.slice(s,e+1));setMealPlan(p=>p.map((d,i)=>i===changeMealModal?{...d,...parsed,needToBuy:parsed.needToBuy||[],shoppingNeeded:(parsed.needToBuy||[]).map(n=>typeof n==="string"?{qty:1,unit:"",name:n}:n),ingredients:parsed.ingredients||[]}:d));setExpandedIngDay(null);setChangeMealModal(null);}catch(e){alert("Could not parse meal suggestion");}setChangeMealLoading(false);}} style={{width:"100%",padding:"10px",background:"transparent",border:"1px solid "+C.accent,borderRadius:8,color:C.accent,fontFamily:FM,fontSize:13,cursor:"pointer"}}>🍽 {changeMealLoading?"Thinking...":"Make This Meal"}</button></div><button onClick={()=>setChangeMealModal(null)} style={{width:"100%",padding:"8px",background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer"}}>Cancel</button></div></div>}
{/* == SHOPPING == */}
        {!loading&&tab==="shopping"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:FD,fontSize:24}}>Shopping List</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {shopping.length>0&&<><div style={{fontFamily:FM,fontSize:seniorMode?15:11,color:C.muted,fontWeight:seniorMode?600:400}}>{shopping.filter(i=>i.checked).length}/{shopping.length} items</div><button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11}} onClick={printShopping}>🖨 Print</button>{shopPartnerEmail&&<button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11}} onClick={async()=>{const btn=document.activeElement;btn.textContent="Sending...";btn.disabled=true;try{const r=await fetch("/api/send-shopping-list",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({toEmail:shopPartnerEmail,toName:shopPartnerName,items:shopping,fromName:"Smart Kitchen"})});const d=await r.json();if(d.success){setEmailSentModal(shopPartnerEmail);}else if(d.fallback){window.location.href=d.mailtoUrl;}else{alert("Could not send email. Please try again.");}}catch(e){alert("Could not send email: "+e.message);}btn.textContent="Email to "+(shopPartnerName||shopPartnerEmail);btn.disabled=false;}}>Email to {shopPartnerName||shopPartnerEmail}</button>}{shopPhone&&<button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11,border:"1px solid #22c55e",color:"#22c55e"}} onClick={async()=>{setSmsSent(false);try{const r=await fetch("/api/send-shopping-sms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({toPhone:shopPhone,items:shopping,fromName:shopPartnerName||"Smart Kitchen"})});const d=await r.json();if(d.success){setSmsSent(true);setTimeout(()=>setSmsSent(false),4000);}else if(d.fallback&&d.smsUrl){window.open(d.smsUrl);}else{alert("Could not send SMS. Please try again.");}}catch(e){alert("Could not send SMS: "+e.message);}}}>{smsSent?"Sent!":"Text to "+shopPhone}</button>}<button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11,background:"#00873A",border:"1px solid #00873A",color:"#ffffff",fontWeight:600}} onClick={sendToDelivery} disabled={instacartLoading}>{instacartLoading?"Opening...":"🛒 "+(deliveryService==="shipt"?"Send to Shipt":"Send to Instacart")}</button>{restockQueue.length>0&&<button style={{...bBtn("ghost"),padding:"6px 12px",fontSize:11,border:"1px solid "+C.accent,color:C.accent}} onClick={()=>{const toAdd=restockQueue.filter(name=>!shopping.some(s=>s.name.toLowerCase()===name.toLowerCase())).map(name=>({name,qty:1,unit:"",category:"Pantry",checked:false,suggestBulk:false}));if(toAdd.length>0){setShopping(p=>[...p,...toAdd]);alert(toAdd.length+" item"+(toAdd.length>1?"s":"")+" added to shopping list.");}else{alert("All restock items are already on the list.");}  }}>+ {restockQueue.length} Restock</button>}</>}
              </div>
            </div>
{user&&(
  <button style={{width:"100%",marginBottom:14,padding:seniorMode?"12px 16px":"8px 14px",background:"#7c3aed11",border:"1px solid #7c3aed44",borderRadius:10,color:"#7c3aed",fontFamily:FM,fontWeight:700,fontSize:seniorMode?15:12,cursor:cellarPullStatus==="saving"?"not-allowed":"pointer",opacity:cellarPullStatus==="saving"?0.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
  onClick={async()=>{if(cellarPullStatus==="saving")return;setCellarPullStatus("saving");try{const {data}=await supabase.from("profiles").select("sc_cloud_data").eq("id",user.id).single();if(data?.sc_cloud_data){const parsed=typeof data.sc_cloud_data==="string"?JSON.parse(data.sc_cloud_data):data.sc_cloud_data;const cellarList=parsed.shoppingList||[];if(cellarList.length===0){setCellarPullStatus("empty");setTimeout(()=>setCellarPullStatus(null),3000);return;}const toAdd=cellarList.filter(ci=>!shopping.some(si=>(si.name||"").toLowerCase()===(ci.name||"").toLowerCase()));if(toAdd.length>0){setShopping(p=>[...p,...toAdd.map(ci=>({name:ci.name,qty:1,unit:"bottle",category:"Smart Cellar",checked:false,source:"Smart Cellar Advisor"}))]);setCellarPullStatus("done");}else{setCellarPullStatus("already");}}else{setCellarPullStatus("empty");}}catch(e){console.error("Cellar pull error:",e);setCellarPullStatus("error");}setTimeout(()=>setCellarPullStatus(null),3000);}}>
    <span style={{fontSize:16}}>🍾</span>
    <span>{cellarPullStatus==="saving"?"⏳ Loading…":cellarPullStatus==="done"?"✓ Cellar Items Added!":cellarPullStatus==="empty"?"🍾 No items in Smart Cellar Buy List":cellarPullStatus==="already"?"✓ Already on List":cellarPullStatus==="error"?"✕ Could not load":"🍾 Add from Smart Cellar Buy List"}</span>
  </button>
)}
            {shopping.length===0?(
              <div style={{textAlign:"center",padding:60}}>
                <div style={{fontFamily:FD,fontSize:48,color:C.accent,marginBottom:16}}>🛒</div>
                <div style={{color:C.muted,marginBottom:20}}>{mealPlan.length===0?"Build a meal plan first":"Generate your list from the meal plan"}</div>
                {mealPlan.length>0?<button style={bBtn("primary")} onClick={genShopping}>🛒 Generate</button>:<button style={bBtn("ghost")} onClick={()=>setTab("mealplan")}>→ Meal Plan</button>}
              </div>
            ):(
              <div>
                {[...CATEGORIES.filter(cat=>shopping.some(i=>i.category===cat)),...(shopping.some(i=>!CATEGORIES.includes(i.category))?["Smart Cellar"]:[])].filter((cat,idx,arr)=>arr.indexOf(cat)===idx).map(cat=>(
                  <div key={cat} style={{marginBottom:18}}>
                    <div style={{fontFamily:FM,fontSize:10,color:CAT_COLORS[cat]||C.muted,letterSpacing:1.2,marginBottom:7,display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:CAT_COLORS[cat]||C.muted}}/>{cat.toUpperCase()}
                    </div>
                    {shopping.filter(i=>cat==="Smart Cellar"?!CATEGORIES.includes(i.category):i.category===cat).map((item)=>{
                      const gi=shopping.indexOf(item);
                      return(
                        <div key={gi} onClick={()=>setShopping(p=>p.map((si,sii)=>sii===gi?{...si,checked:!si.checked}:si))}
                          style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:seniorMode?"16px 18px":"10px 14px",marginBottom:seniorMode?10:6,display:"flex",alignItems:"center",gap:12,cursor:"pointer",opacity:item.checked?0.45:1,transition:"opacity 0.2s"}}>
                          <div style={{width:seniorMode?28:18,height:seniorMode?28:18,borderRadius:4,border:"2px solid "+(item.checked?C.green:C.border),background:item.checked?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:seniorMode?16:11,flexShrink:0}}>{item.checked&&"✓"}</div>
                          <div style={{flex:1,fontSize:seniorMode?18:13,fontWeight:seniorMode?600:400,lineHeight:1.4,textDecoration:item.checked?"line-through":"none"}}>{item.name}</div>
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
            <div style={{background:C.card,border:"1px solid "+C.accent+"44",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontSize:10,fontFamily:FM,color:C.accent,letterSpacing:0.8}}>🧁 BAKING PANTRY:</div>
              {[...new Set([...inventory.filter(i=>i.category==="Baking").map(i=>i.name),...["Brownie Mixes","Muffin Mixes","Pie Crusts","Puff Pastry","Crescent Dough","Cream Cheese","Condensed Milk","Pie Fillings","Flour","Sugar","Vanilla","Cinnamon","Baking Powder","Baking Soda","Cocoa Powder","Powdered Sugar","Brown Sugar","Chocolate Chips","Butter","Eggs"].filter(name=>inventory.some(i=>i.name.toLowerCase().includes(name.toLowerCase())))])].map(i=>(
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
                  {desserts.map(d=>{
                    const rating=dessertRatings[d.name]?.rating||0;
                    return(
                    <div key={d.id} style={{background:C.card,border:"1px solid "+(rating===1?C.red+"66":rating>=4?C.accent+"66":C.border),borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.15s",opacity:rating===1?0.5:1}}
                      onClick={()=>setActiveDessert(d)}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.cardHover;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=rating===1?C.red+"66":rating>=4?C.accent+"66":C.border;e.currentTarget.style.background=C.card;}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"flex-start"}}>
                        {mealPhotos[d.name]&&<div style={{marginBottom:8,borderRadius:8,overflow:"hidden"}}><img src={mealPhotos[d.name]} alt={d.name} style={{width:"100%",maxHeight:140,objectFit:"cover",display:"block",borderRadius:8}} /></div>}
                        <div style={{fontFamily:FD,fontSize:19,lineHeight:1.3,flex:1}}>{d.name}{rating===5&&<span style={{marginLeft:6,fontSize:14}}>🏆</span>}{rating===4&&<span style={{marginLeft:6,fontSize:14}}>❤</span>}</div>
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
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",gap:2}} onClick={e=>e.stopPropagation()}>
                          {[1,2,3,4,5].map(star=>(
                            <button key={star} onClick={e=>{e.stopPropagation();const mealName=d.name;setDessertRatings(prev=>{const cur=prev[d.name]?.rating||0;const next={...prev};if(cur===star){delete next[d.name];}else{next[d.name]={rating:star,recipe:d};}try{localStorage.setItem("sk_dessertRatings",JSON.stringify(next));}catch{}if(star===5&&cur!==5){const skips=parseInt(localStorage.getItem("sk_photoSkipCount")||"0");if(skips<3) setTimeout(()=>setPhotoPromptMeal(mealName),300);}return next;});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:seniorMode?22:16,padding:"0 1px",color:star<=rating?"#f59e0b":"#555",transition:"color 0.1s"}} title={star===1?"Never suggest again":star===5?"Keeper!":"Rate "+star+" stars"}>
                              {star<=rating?"★":"☆"}
                            </button>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                          <span style={{fontSize:11,color:C.accent,fontFamily:FM,letterSpacing:0.5}}>TAP FOR RECIPE →</span>
                          <a href={getRecipeUrl(d.name)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:10,color:"#60a5fa",fontFamily:FM,textDecoration:"none",fontWeight:600}}>🌐 web</a>
                          <button onClick={e=>{e.stopPropagation();const today=new Date();const dateStr=today.toISOString().split("T")[0].replace(/-/g,"");window.open("https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent("Dessert: "+d.name)+"&dates="+dateStr+"/"+dateStr+"&details="+encodeURIComponent(d.description||""),"_blank");}} style={{background:"transparent",border:"1px solid #5b9cf6",borderRadius:4,color:"#5b9cf6",fontFamily:FM,fontSize:10,padding:"3px 8px",cursor:"pointer"}}>📅 Calendar</button>
                          <button onClick={e=>{e.stopPropagation();setPhotoPromptMeal(d.name);}} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:6,color:C.muted,fontFamily:FM,fontSize:seniorMode?16:12,padding:seniorMode?"8px 14px":"6px 10px",cursor:"pointer"}} title="Add photo" disabled={isViewer}>📸 {mealPhotos[d.name]?"Change":"Photo"}</button>
                        </div>
                      </div>
                    </div>
                  )})}
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
              {tier==="medical"?(
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <input type="number" min="1" value={familySize} onChange={e=>{const n=Math.max(1,parseInt(e.target.value)||1);setFamilySize(n);setFamilyProfiles(p=>{const base=p.length>=n?p:p.concat(Array.from({length:n-p.length},(_,i)=>({id:p.length+i+1,name:"",role:"adult",restriction:"standard",customParams:{},active:true})));return base.map((pr,i)=>({...pr,active:i<n}));});}} style={{width:70,padding:"6px 10px",borderRadius:8,border:"1px solid "+C.accent,background:C.card,color:C.text,fontFamily:FM,fontSize:16,fontWeight:700}}/>
                  <span style={{fontSize:12,color:C.muted,fontFamily:FM}}>family members (Medical+ - no limit)</span>
                </div>
              ):(
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {(tier==="solo"?[1]:tier==="family"?[2,3,4,5,6]:[1,2,3,4,5,6,7,8]).map(n=>(
                    <button key={n} onClick={()=>{setFamilySize(n);setFamilyProfiles(p=>p.map((pr,i)=>({...pr,active:i<n})));}}
                      style={{width:38,height:38,borderRadius:8,border:"1px solid "+(familySize===n?C.accent:C.border),background:familySize===n?C.accent+"22":"transparent",color:familySize===n?C.accent:C.muted,cursor:tier==="solo"?"not-allowed":"pointer",fontFamily:FM,fontSize:14,fontWeight:600}}>
                      {n}
                    </button>
                  ))}
                  {tier==="solo"&&<span style={{fontSize:11,color:C.muted,fontFamily:FM,alignSelf:"center",marginLeft:4}}>Solo plan - 1 member</span>}
                </div>
              )}
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
                        {isEditing?"✓ Done":"✏ Edit"}
                      </button>
                      <button onClick={()=>{if(window.confirm("Remove "+(profile.name||"this member")+" from your household? This cannot be undone.")){setFamilyProfiles(prev=>prev.filter(p=>p.id!==profile.id));setFamilySize(prev=>Math.max(1,prev-1));if(editingProfile===profile.id)setEditingProfile(null);}}} style={{...bBtn("ghost"),padding:"5px 10px",fontSize:11,border:"1px solid #dc2626",color:"#dc2626"}}>✕ Remove</button>
                    </div>
                    {isEditing&&(
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        <div><Label>NAME</Label><input style={bInp} placeholder={"Family member "+(idx+1)} value={profile.name} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,name:e.target.value}:pr))}/></div><div style={{marginTop:10}}><Label>DATE OF BIRTH <span style={{fontWeight:400,color:C.muted,fontSize:9}}>(optional)</span></Label><input type="date" style={{...bInp,colorScheme:darkMode?"dark":"light"}} value={profile.dob||""} max={new Date().toISOString().split("T")[0]} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,dob:e.target.value}:pr))}/>{profile.dob&&(()=>{const age=Math.floor((new Date()-new Date(profile.dob+"T12:00:00"))/(1000*60*60*24*365.25));const today=new Date();const bday=new Date(profile.dob+"T12:00:00");const nextBday=new Date(today.getFullYear(),bday.getMonth(),bday.getDate());if(nextBday<today) nextBday.setFullYear(today.getFullYear()+1);const daysUntil=Math.ceil((nextBday-today)/(1000*60*60*24));return <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:4,display:"flex",gap:10,flexWrap:"wrap"}}><span style={{color:C.text,fontWeight:600}}>Age {age}</span>{daysUntil<=30&&<span style={{color:C.accent,fontWeight:600}}>🎂 Birthday in {daysUntil} day{daysUntil===1?"":"s"}!</span>}{daysUntil>30&&daysUntil<=365&&<span>🎂 Birthday in {daysUntil} days</span>}</div>;})()}</div>
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
                        {/* Guided Plate Mode - all paid tiers */}<div style={{marginTop:10,background:C.surface,borderRadius:10,padding:12,borderLeft:"3px solid #3b82f6"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:"#3b82f6",letterSpacing:0.8}}>GUIDED PLATE MODE</div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginTop:2}}>Step-by-step plating with live nutrition tracking</div></div><button onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,guidedPlateMode:!profile.guidedPlateMode}:pr))} style={{background:profile.guidedPlateMode?"#3b82f6":"transparent",border:"2px solid #3b82f6",borderRadius:20,padding:"4px 14px",fontFamily:FM,fontSize:11,fontWeight:700,color:profile.guidedPlateMode?"#fff":"#3b82f6",cursor:"pointer"}}>{profile.guidedPlateMode?"ON":"OFF"}</button></div></div>{/* Medical+ Profile Fields */}
                        <div style={{marginTop:10,position:"relative"}}>
                          {!can.medicalCompliance&&<div style={{position:"absolute",inset:0,zIndex:2,cursor:"pointer",borderRadius:10}} onClick={()=>onUpgrade()} title="Upgrade to Medical+"/>}
                          <div style={{opacity:can.medicalCompliance?1:0.45,pointerEvents:can.medicalCompliance?"auto":"none"}}>
                          <div style={{background:C.surface,borderRadius:10,padding:12,borderLeft:"3px solid #dc2626"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                              <Label style={{color:"#dc2626"}}>MEDICAL+ PROFILE</Label>
                              {!can.medicalCompliance&&<span style={{fontSize:10,background:"#c8963e",color:"#fff",borderRadius:10,padding:"2px 8px",fontWeight:700,cursor:"pointer"}} onClick={()=>onUpgrade()}>Add $10/mo</span>}
                            </div>
                            <div style={{marginBottom:8}}>
                              <Label>DIETARY PLAN</Label>
                              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                {["Diabetic-Friendly","Pre-Diabetic","GLP-1 / Weight Loss","Renal","Cardiac","High Cholesterol","Bariatric","Low Sodium","Low FODMAP","Mediterranean","MIND Diet","Keto","Carnivore","High-Protein","Anti-Inflammatory","Gout","GERD / Acid Reflux","Osteoporosis","Gluten-Free","Custom"].map(plan=>(<button key={plan} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medicalPlan:pr.medicalPlan===plan?null:plan}:pr))} style={{padding:"3px 9px",borderRadius:20,border:"1px solid "+(profile.medicalPlan===plan?"#dc2626":C.border),background:profile.medicalPlan===plan?"#dc262618":"transparent",color:profile.medicalPlan===plan?"#dc2626":C.muted,fontFamily:FM,fontSize:11,cursor:"pointer"}}>{plan}</button>))}
                              </div>
                              {profile.medicalPlan==="Custom"&&<input style={{...bInp,marginTop:6,fontSize:12}} placeholder="Describe custom dietary plan..." value={profile.customPlanNote||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,customPlanNote:e.target.value}:pr))}/>}{profile.medicalPlan==="Bariatric"&&(<div style={{marginTop:8}}><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:4,letterSpacing:0.8}}>BARIATRIC PHASE</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{["Liquid","Pureed","Soft","Solid"].map(phase=>(<button key={phase} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,bariatricPhase:pr.bariatricPhase===phase?null:phase}:pr))} style={{padding:"3px 9px",borderRadius:20,border:"1px solid "+(profile.bariatricPhase===phase?"#dc2626":C.border),background:profile.bariatricPhase===phase?"#dc262618":"transparent",color:profile.bariatricPhase===phase?"#dc2626":C.muted,fontFamily:FM,fontSize:11,cursor:"pointer"}}>{phase}</button>))}</div><input style={{...bInp,fontSize:12,marginTop:6}} type="date" placeholder="Phase start date" value={profile.bariatricPhaseDate||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,bariatricPhaseDate:e.target.value}:pr))}/></div>)}<div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:4,letterSpacing:0.8}}>DAILY PROTEIN TARGET (g)</div><input style={{...bInp,fontSize:12}} type="number" placeholder="e.g. 75 (auto if blank)" value={profile.proteinTargetG||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,proteinTargetG:e.target.value?parseFloat(e.target.value):undefined}:pr))}/></div><div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:4,letterSpacing:0.8}}>GOAL WEIGHT (lbs, optional)</div><input style={{...bInp,fontSize:12}} type="number" placeholder="e.g. 165" value={profile.goalWeightLbs||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,goalWeightLbs:e.target.value?parseFloat(e.target.value):undefined}:pr))}/></div></div><div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:4,letterSpacing:0.8}}>HEIGHT (optional)</div><input style={{...bInp,fontSize:12}} placeholder="e.g. 5ft 8in" value={profile.heightStr||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,heightStr:e.target.value}:pr))}/></div><div><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:4,letterSpacing:0.8}}>ACTIVITY LEVEL</div><div style={{display:"flex",gap:4}}>{["Light","Moderate","Active"].map(lvl=>(<button key={lvl} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,activityLevel:pr.activityLevel===lvl?null:lvl}:pr))} style={{flex:1,padding:"3px 4px",borderRadius:20,border:"1px solid "+(profile.activityLevel===lvl?"#22c55e":C.border),background:profile.activityLevel===lvl?"#22c55e18":"transparent",color:profile.activityLevel===lvl?"#22c55e":C.muted,fontFamily:FM,fontSize:10,cursor:"pointer"}}>{lvl}</button>))}</div></div></div><div style={{marginTop:8}}><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:4,letterSpacing:0.8}}>WW DAILY POINTS BUDGET (optional)</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input style={{...bInp,fontSize:12,maxWidth:80}} type="number" placeholder="e.g. 23" value={profile.wwPointsBudget||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,wwPointsBudget:e.target.value?parseFloat(e.target.value):undefined}:pr))}/><div style={{fontFamily:FM,fontSize:10,color:C.muted,lineHeight:1.4}}>Enter your WW-assigned daily budget. Smart Kitchen estimates compatible Points from weighed food.</div></div></div>
                            </div>
                            <div style={{marginBottom:8}}>
                              <Label>ALLERGIES</Label>
                              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
                                {["Peanuts","Tree Nuts","Shellfish","Fish","Dairy","Eggs","Soy","Wheat/Gluten","Sesame"].map(a=>{const active=(profile.medicalAllergies||[]).includes(a);return <button key={a} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medicalAllergies:active?(pr.medicalAllergies||[]).filter(x=>x!==a):[...(pr.medicalAllergies||[]),a]}:pr))} style={{padding:"3px 9px",borderRadius:20,border:"1px solid "+(active?"#ef4444":C.border),background:active?"#ef444422":"transparent",color:active?"#ef4444":C.muted,fontFamily:FM,fontSize:11,cursor:"pointer"}}>{a}</button>;})}
                              </div>
                              <input style={{...bInp,fontSize:12}} placeholder="Additional allergies (e.g. mango, latex)..." value={profile.medicalAllergiesCustom||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medicalAllergiesCustom:e.target.value}:pr))}/>
                            </div>
                            <div style={{marginBottom:8}}>
                              <Label>MEDICATIONS</Label>
                              {(profile.medications||[]).map((med,mi)=>(<div key={mi} style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr auto",gap:4,marginBottom:4,alignItems:"center"}}><MedAutoComplete value={med.name||""} onChange={v=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medications:pr.medications.map((m,i)=>i===mi?{...m,name:v}:m)}:pr))}/><input style={{...bInp,fontSize:12}} placeholder="Dose" value={med.dose||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medications:pr.medications.map((m,i)=>i===mi?{...m,dose:e.target.value}:m)}:pr))}/><input style={{...bInp,fontSize:12}} placeholder="e.g. 2 daily, 1 nightly, 1 as needed" value={med.schedule||med.freq||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medications:pr.medications.map((m,i)=>i===mi?{...m,schedule:e.target.value,freq:e.target.value}:m)}:pr))}/><button onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medications:pr.medications.filter((_,i)=>i!==mi)}:pr))} style={{...bBtn("ghost"),padding:"4px 8px",color:C.red,fontSize:12}}>X</button></div>))}
                              <button onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,medications:[...(pr.medications||[]),{name:"",dose:"",freq:""}]}:pr))} style={{...bBtn("ghost"),fontSize:11,padding:"4px 10px"}}>+ Add Medication</button>
                            </div>
                            <div style={{marginBottom:8}}>
                              <Label>SUPPLEMENTS</Label>
                              {(profile.supplements||[]).map((sup,si)=>(<div key={si} style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr auto",gap:4,marginBottom:4,alignItems:"center"}}><input style={{...bInp,fontSize:12}} placeholder="Supplement name" value={sup.name||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,supplements:pr.supplements.map((s,i)=>i===si?{...s,name:e.target.value}:s)}:pr))}/><input style={{...bInp,fontSize:12}} placeholder="Dose" value={sup.dose||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,supplements:pr.supplements.map((s,i)=>i===si?{...s,dose:e.target.value}:s)}:pr))}/><input style={{...bInp,fontSize:12}} placeholder="e.g. 1 daily, 2 with meals" value={sup.schedule||sup.qty||""} onChange={e=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,supplements:pr.supplements.map((s,i)=>i===si?{...s,schedule:e.target.value}:s)}:pr))}/><button onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,supplements:pr.supplements.filter((_,i)=>i!==si)}:pr))} style={{...bBtn("ghost"),padding:"4px 8px",color:C.red,fontSize:12}}>X</button></div>))}
                              <button onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,supplements:[...(pr.supplements||[]),{name:"",dose:""}]}:pr))} style={{...bBtn("ghost"),fontSize:11,padding:"4px 10px"}}>+ Add Supplement</button>
                            </div>
                            <div>
                              <Label>AI ENFORCEMENT LEVEL</Label>
                              <div style={{display:"flex",gap:6}}>
                                {[["strict","Strict","Never suggest conflicting meals"],["warn","Warn","Flag with badge on recipe"],["inform","Inform","Educational notes only"]].map(([val,label,desc])=>(<button key={val} onClick={()=>setFamilyProfiles(p=>p.map(pr=>pr.id===profile.id?{...pr,enforcement:val}:pr))} style={{flex:1,padding:"6px 4px",borderRadius:8,border:"1px solid "+(profile.enforcement===val?"#dc2626":C.border),background:profile.enforcement===val?"#dc262618":"transparent",color:profile.enforcement===val?"#dc2626":C.muted,fontFamily:FM,fontSize:10,cursor:"pointer",textAlign:"center"}}><div style={{fontWeight:600}}>{label}</div><div style={{fontSize:9,marginTop:2,opacity:0.8}}>{desc}</div></button>))}
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:20,borderTop:"1px solid "+C.border,paddingTop:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:FD,fontSize:16,color:"#a78bfa"}}>⚕ Temporary Medical Diets</div>
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
                    }}>⚕ Save Temporary Diet</button>
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
              <div style={{fontFamily:FD,fontSize:22,color:C.accent}}>{rpMode==="protein"?"🥩 Repackage Protein":rpMode==="veg"?"🫕 Prep Sauté Blend Bags":"🦌 Process Harvest"}</div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>setRpMode("protein")} style={{...bBtn(rpMode==="protein"?"orange":"ghost"),padding:"6px 12px",fontSize:11}}>🥩</button>
                <button onClick={()=>setRpMode("veg")} style={{...bBtn(rpMode==="veg"?"teal":"ghost"),padding:"6px 12px",fontSize:11}}>🫕</button>
                <button onClick={()=>setRpMode("harvest")} style={{...bBtn(rpMode==="harvest"?"green":"ghost"),padding:"6px 12px",fontSize:11}}>🦌</button>
                <button onClick={()=>setRpOpen(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
              </div>
            </div>
            {rpMode==="protein"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div>
                    <Label>PROTEIN NAME</Label>
                    <input style={bInp} spellCheck="true" placeholder="e.g. Chicken Breast" value={rpPName} onChange={e=>{setRpPName(e.target.value);setRpPPreview(null);}}/>
                    {(()=>{ const m=findCloseInventoryMatch(rpPName,inventory); return m&&(
                      <div style={{marginTop:6,fontSize:11,color:C.orange,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span>Did you mean <strong>{m}</strong>? Typos create a separate item instead of adding to the existing one.</span>
                        <button onClick={()=>{setRpPName(m);setRpPPreview(null);}} style={{...bBtn("ghost"),padding:"2px 8px",fontSize:10,border:"1px solid "+C.orange,color:C.orange}}>Use "{m}"</button>
                      </div>
                    );})()}
                  </div>
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
                <div style={{background:C.surface,border:"1px solid "+C.orange+"33",borderRadius:10,padding:12,marginBottom:14,fontSize:seniorMode?16:12,color:C.muted,lineHeight:1.6}}>
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
                    setRpYieldConfirm({type:"sauteBlend",estimated:bags,o,c,p});setRpActualBags(String(bags));
                  }}>🫕 Confirm — Estimated {Math.floor(((parseFloat(rpVSessions.find(s=>s.id==="onions")?.count||0)||0)*1.5+((parseFloat(rpVSessions.find(s=>s.id==="celery")?.count||0)||0)*0.5)+((parseFloat(rpVSessions.find(s=>s.id==="peppers")?.count||0)||0)*1.0))/2)} Bags</button>
                </div>
              </div>
            )}
            {rpMode==="harvest"&&(
              <div>
                <div style={{background:C.surface,border:"1px solid "+C.green+"33",borderRadius:10,padding:12,marginBottom:14,fontSize:seniorMode?16:12,color:C.muted,lineHeight:1.6}}>
                  <strong style={{color:C.green}}>Process a harvest</strong> — a whole deer, a batch of fish, a bushel of garden produce — into portions ready for inventory.
                </div>
                <div style={{display:"flex",gap:7,marginBottom:14}}>
                  <button onClick={()=>{setRpHCat("Wild Harvest");setRpHItem("");setRpHRaw("");}} style={{...bBtn(rpHCat==="Wild Harvest"?"green":"ghost"),flex:1}}>🦌 Wild Harvest</button>
                  <button onClick={()=>{setRpHCat("Home Harvest");setRpHItem("");setRpHRaw("");}} style={{...bBtn(rpHCat==="Home Harvest"?"green":"ghost"),flex:1}}>🌱 Home Harvest</button>
                </div>
                <div style={{marginBottom:12}}>
                  <Label>{rpHCat==="Wild Harvest"?"SPECIES / CUT":"PRODUCE"}</Label>
                  <select style={bInp} value={rpHItem} onChange={e=>{
                    const val=e.target.value;
                    setRpHItem(val);
                    setRpHRaw("");
                    if(rpHCat==="Home Harvest"){
                      const p=HOME_PRODUCE.find(x=>x.name===val);
                      const saved=getHarvestMeasurePref(val);
                      const measure=saved?.measure||(p&&p.unitType!=="bulk"?p.unitType:"lbs");
                      setRpHMeasure(measure);
                      const cfg=MEASURE_CONFIG[measure];
                      setRpHOz(saved?.size||cfg?.defaultSize||16);
                    }
                  }}>
                    <option value="">Select...</option>
                    {(rpHCat==="Wild Harvest"?WILD_SPECIES:HOME_PRODUCE).map(s=><option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                {rpHCat==="Wild Harvest"?(
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      <div><Label>TOTAL WEIGHT (lbs)</Label><input style={bInp} type="number" placeholder="e.g. 45" value={rpHRaw} onChange={e=>setRpHRaw(e.target.value)}/></div>
                      <div>
                        <Label>OZ PER PORTION</Label>
                        <div style={{display:"flex",gap:6}}>
                          {[4,5,6,8,16].map(oz=>(
                            <button key={oz} onClick={()=>setRpHOz(oz)}
                              style={{...bBtn("ghost"),padding:"6px 8px",fontSize:11,background:rpHOz===oz?C.green+"22":"transparent",color:rpHOz===oz?C.green:C.muted,border:"1px solid "+(rpHOz===oz?C.green:C.border)}}>
                              {oz}oz
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {rpHItem&&rpHRaw&&(
                      <div style={{background:"#13231a",border:"1px solid "+C.green+"44",borderRadius:10,padding:14,marginBottom:14,textAlign:"center"}}>
                        <div style={{fontSize:22,fontWeight:700,fontFamily:FD,color:C.green}}>{Math.floor((parseFloat(rpHRaw)*16)/rpHOz)} portions</div>
                        <div style={{fontSize:10,color:C.muted,fontFamily:FM,marginTop:2}}>{rpHRaw} lbs ÷ {rpHOz}oz each</div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:8}}>
                      <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setRpOpen(false)}>Cancel</button>
                      <button style={{...bBtn("green"),flex:2,opacity:(rpHItem&&rpHRaw)?1:0.4}} onClick={commitHarvestWild}>🦌 Add to Wild Harvest Inventory</button>
                    </div>
                  </div>
                ):(()=>{
                  const hp=HOME_PRODUCE.find(x=>x.name===rpHItem);
                  const isBulkItem=(hp?.unitType||"bulk")==="bulk";
                  if(isBulkItem) return(
                    <div>
                      <div style={{marginBottom:12}}>
                        <Label>RAW QUANTITY ({rpHItem?getHarvestYield(rpHItem).rawUnit:"lbs"})</Label>
                        <input style={bInp} type="number" placeholder="e.g. 2" value={rpHRaw} onChange={e=>setRpHRaw(e.target.value)}/>
                      </div>
                      <div style={{marginBottom:12}}>
                        <Label>PRESERVATION METHOD</Label>
                        <div style={{display:"flex",gap:6}}>
                          {["Canned","Frozen","Fresh"].map(f=>(
                            <button key={f} onClick={()=>setRpHForm(f)} style={{...bBtn(rpHForm===f?"green":"ghost"),flex:1,fontSize:11}}>{f}</button>
                          ))}
                        </div>
                      </div>
                      {rpHItem&&rpHRaw&&(()=>{
                        const y=getHarvestYield(rpHItem);
                        const rate=y.rate[rpHForm]??y.rate.Fresh??1;
                        const est=Math.max(1,Math.round(parseFloat(rpHRaw)*rate));
                        return(
                          <div style={{background:"#13231a",border:"1px solid "+C.green+"44",borderRadius:10,padding:14,marginBottom:14,textAlign:"center"}}>
                            <div style={{fontSize:22,fontWeight:700,fontFamily:FD,color:C.green}}>~{est} {y.outputUnit[rpHForm]||"units"}</div>
                            <div style={{fontSize:10,color:C.muted,fontFamily:FM,marginTop:2}}>estimated — you\u2019ll confirm the actual count next</div>
                          </div>
                        );
                      })()}
                      <div style={{display:"flex",gap:8}}>
                        <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setRpOpen(false)}>Cancel</button>
                        <button style={{...bBtn("green"),flex:2,opacity:(rpHItem&&rpHRaw)?1:0.4}} onClick={estimateHarvestHome}>🌱 Confirm Yield</button>
                      </div>
                    </div>
                  );
                  const cfg=MEASURE_CONFIG[rpHMeasure]||MEASURE_CONFIG.lbs;
                  const raw=parseFloat(rpHRaw)||0;
                  const qty=rpHItem&&rpHRaw?(cfg.sizeOptions?cfg.calc(raw,rpHOz):cfg.calc(raw)):0;
                  return(
                    <div>
                      {rpHItem&&(
                        <div style={{marginBottom:12}}>
                          <Label>MEASURE BY</Label>
                          <div style={{display:"flex",gap:6}}>
                            {["lbs","oz","each","dozen"].map(m=>(
                              <button key={m} onClick={()=>{setRpHMeasure(m);const c=MEASURE_CONFIG[m];const sz=c.defaultSize||null;if(sz) setRpHOz(sz);saveHarvestMeasurePref(rpHItem,m,sz);}}
                                style={{...bBtn("ghost"),flex:1,fontSize:11,background:rpHMeasure===m?C.green+"22":"transparent",color:rpHMeasure===m?C.green:C.muted,border:"1px solid "+(rpHMeasure===m?C.green:C.border)}}>
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={cfg.sizeOptions?{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}:{marginBottom:12}}>
                        <div><Label>{cfg.label}</Label><input style={bInp} type="number" placeholder={cfg.placeholder} value={rpHRaw} onChange={e=>setRpHRaw(e.target.value)}/></div>
                        {cfg.sizeOptions&&(
                          <div>
                            <Label>{cfg.sizeLabel}</Label>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              {cfg.sizeOptions.map(sz=>(
                                <button key={sz} onClick={()=>{setRpHOz(sz);saveHarvestMeasurePref(rpHItem,rpHMeasure,sz);}}
                                  style={{...bBtn("ghost"),padding:"6px 8px",fontSize:11,background:rpHOz===sz?C.green+"22":"transparent",color:rpHOz===sz?C.green:C.muted,border:"1px solid "+(rpHOz===sz?C.green:C.border)}}>
                                  {sz}{cfg.sizeUnit}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {rpHItem&&rpHRaw&&qty>0&&(
                        <div style={{background:"#13231a",border:"1px solid "+C.green+"44",borderRadius:10,padding:14,marginBottom:14,textAlign:"center"}}>
                          <div style={{fontSize:22,fontWeight:700,fontFamily:FD,color:C.green}}>{qty} {cfg.outputUnit}</div>
                          <div style={{fontSize:10,color:C.muted,fontFamily:FM,marginTop:2}}>{cfg.estimateLine(rpHRaw,rpHOz,qty)}</div>
                        </div>
                      )}
                      <div style={{display:"flex",gap:8}}>
                        <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setRpOpen(false)}>Cancel</button>
                        <button style={{...bBtn("green"),flex:2,opacity:(rpHItem&&rpHRaw&&qty>0)?1:0.4}} onClick={commitHarvestDeterministic}>🌱 Add to Home Harvest Inventory</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* == YIELD CONFIRM MODAL == */}
      {rpYieldConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:24,maxWidth:400,width:"100%"}}>
            <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:8}}>{rpYieldConfirm.type==="homeHarvest"?"🌱 Actual Yield?":"🫕 Actual Yield?"}</div>
            <div style={{fontSize:14,color:C.muted,marginBottom:20}}>
              {rpYieldConfirm.type==="homeHarvest"
                ?<>Estimated <span style={{color:C.orange,fontWeight:700}}>{rpYieldConfirm.estimated} {rpYieldConfirm.unit}</span> from {rpYieldConfirm.rawQty} {rpYieldConfirm.rawUnit} of {rpYieldConfirm.itemName}. How many {rpYieldConfirm.unit} did you actually get?</>
                :<>Estimated <span style={{color:C.orange,fontWeight:700}}>{rpYieldConfirm.estimated} bags</span>. How many 2-cup bags did you actually get?</>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <button onClick={()=>setRpActualBags(b=>String(Math.max(1,parseInt(b||"0")-1)))} style={{...bBtn("ghost"),padding:"8px 16px",fontSize:20}}>−</button>
              <input type="number" min="1" max="200" value={rpActualBags} onChange={e=>setRpActualBags(e.target.value)} style={{flex:1,textAlign:"center",fontSize:28,fontWeight:700,fontFamily:FD,color:C.orange,background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"10px 0"}}/>
              <button onClick={()=>setRpActualBags(b=>String(parseInt(b||"0")+1))} style={{...bBtn("ghost"),padding:"8px 16px",fontSize:20}}>+</button>
            </div>
            {parseInt(rpActualBags)!==rpYieldConfirm.estimated&&(
              <div style={{fontSize:12,color:C.muted,marginBottom:16,textAlign:"center"}}>
                {parseInt(rpActualBags)>rpYieldConfirm.estimated?"📈":"📉"} {Math.abs(parseInt(rpActualBags)-rpYieldConfirm.estimated)} {rpYieldConfirm.type==="homeHarvest"?rpYieldConfirm.unit:"bags"} {parseInt(rpActualBags)>rpYieldConfirm.estimated?"more":"fewer"} than estimated — Smart Kitchen will learn from this.
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button style={{...bBtn("ghost"),flex:1}} onClick={()=>{setRpYieldConfirm(null);setRpActualBags("");}}>Cancel</button>
              <button style={{...bBtn("teal"),flex:2}} onClick={()=>{
                const actual=Math.max(1,parseInt(rpActualBags)||rpYieldConfirm.estimated);
                if(rpYieldConfirm.type==="homeHarvest"){
                  try{
                    const h=JSON.parse(localStorage.getItem("sk_yieldHistory")||"[]");
                    h.push({type:"homeHarvest",itemName:rpYieldConfirm.itemName,form:rpYieldConfirm.form,rawQty:rpYieldConfirm.rawQty,rawUnit:rpYieldConfirm.rawUnit,estimated:rpYieldConfirm.estimated,actual,unit:rpYieldConfirm.unit,correctionFactor:parseFloat((actual/Math.max(1,rpYieldConfirm.estimated)).toFixed(2)),ts:Date.now()});
                    localStorage.setItem("sk_yieldHistory",JSON.stringify(h.slice(-50)));
                  }catch{}
                  setInventory(prev=>{
                    const idx=prev.findIndex(i=>i.name.toLowerCase()===rpYieldConfirm.itemName.toLowerCase()&&i.category==="Home Harvest");
                    if(idx>=0) return prev.map((i,ii)=>ii===idx?{...i,qty:i.qty+actual}:i);
                    return [...prev,{id:Date.now(),name:rpYieldConfirm.itemName,qty:actual,unit:rpYieldConfirm.unit,category:"Home Harvest",harvestType:"Produce",location:rpYieldConfirm.form==="Frozen"?"Freezer":rpYieldConfirm.form==="Canned"?"Pantry":"Fridge",preservedForm:rpYieldConfirm.form}];
                  });
                  const hKey=rpYieldConfirm.itemName,hUnit=rpYieldConfirm.unit,hForm=rpYieldConfirm.form;
                  setTimeout(()=>{
                    setBatchPrintCue({itemName:hKey,qty:actual,unit:hUnit,format:hForm==="Canned"?"5164":"5163",category:"Home Harvest"});
                  },400);
                } else {
                  try{
                    const h=JSON.parse(localStorage.getItem("sk_yieldHistory")||"[]");
                    const ingredients=[];
                    if(rpYieldConfirm.o>0) ingredients.push(rpYieldConfirm.o+" onions");
                    if(rpYieldConfirm.c>0) ingredients.push(rpYieldConfirm.c+" stalks celery");
                    if(rpYieldConfirm.p>0) ingredients.push(rpYieldConfirm.p+" peppers");
                    h.push({type:"sauteBlend",ingredients,estimated:rpYieldConfirm.estimated,actual,unit:"2-cup bags",correctionFactor:parseFloat((actual/Math.max(1,rpYieldConfirm.estimated)).toFixed(2)),ts:Date.now()});
                    localStorage.setItem("sk_yieldHistory",JSON.stringify(h.slice(-50)));
                  }catch{}
                  setInventory(prev=>{
                    const idx=prev.findIndex(i=>i.vegType==="sauteBlend");
                    if(idx>=0) return prev.map((i,ii)=>ii===idx?{...i,qty:i.qty+actual}:i);
                    return [...prev,{id:Date.now(),name:"Mixed Sauté Blend",qty:actual,unit:"2-cup bags",category:"Produce",location:"Freezer",isDicedVeg:true,vegType:"sauteBlend",cupsPerBag:2,blendNote:"Diced onion + celery + bell pepper"}];
                  });
                }
                setRpYieldConfirm(null);setRpActualBags("");setRpOpen(false);
              }}>✓ Save {rpActualBags} {rpYieldConfirm.type==="homeHarvest"?rpYieldConfirm.unit:"Bags"}</button>
            </div>
          </div>
        </div>
      )}

      {/* == BATCH PRINT CUE == */}
      {batchPrintCue&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={()=>setBatchPrintCue(null)}>
          <div style={{background:C.card,border:"1px solid "+C.green+"55",borderRadius:16,padding:26,maxWidth:380,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:38,marginBottom:10}}>{batchPrintCue.category==="Wild Harvest"?"🦌":batchPrintCue.category==="Home Harvest"?"🌱":batchPrintCue.category==="Protein"?"🥩":"🫕"}</div>
            <div style={{fontFamily:FD,fontSize:20,color:C.green,marginBottom:8}}>Batch Added!</div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.6,marginBottom:4}}>
              <strong>{batchPrintCue.itemName}</strong>
            </div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:22}}>
              {batchPrintCue.qty} {batchPrintCue.unit} added to inventory.
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...bBtn("ghost"),flex:1}} onClick={()=>setBatchPrintCue(null)}>Not Now</button>
              <button style={{...bBtn("green"),flex:2}} onClick={()=>{
                const key=batchPrintCue.itemName;
                setLabelSelected({[key]:true});
                setLabelQty({[key]:batchPrintCue.qty});
                setLabelFormat(batchPrintCue.format);
                setLabelModal(true);
                setBatchPrintCue(null);
              }}>🏷 Print Labels Now</button>
            </div>
          </div>
        </div>
      )}

      {/* == LEFTOVER SAVED CUE == */}
      {leftoverSavedCue&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={()=>setLeftoverSavedCue(null)}>
          <div style={{background:C.card,border:"1px solid "+C.green+"55",borderRadius:16,padding:26,maxWidth:380,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:38,marginBottom:10}}>🍽</div>
            <div style={{fontFamily:FD,fontSize:20,color:C.green,marginBottom:8}}>Saved to Leftovers!</div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.6,marginBottom:4}}>
              <strong>{leftoverSavedCue.dishName}</strong>
            </div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:22}}>
              Use by {leftoverSavedCue.useByDate}.
            </div>
            <button style={{...bBtn("green"),width:"100%"}} onClick={()=>setLeftoverSavedCue(null)}>Got It</button>
          </div>
        </div>
      )}

      {/* == SCAN MODAL == */}
      {scanOpen&&(
        <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>{if(scanStage!=="review")setScanOpen(false);}}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:18,padding:"12px 16px",maxWidth:540,width:"100%",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontFamily:FM,color:C.muted}}>{scanMode==="receipt"?"🧾 Receipt Scanner":scanMode==="weeklyad"?"🏷 Weekly Ad Scanner":scanMode==="whiteboard"?"📝 List Scanner":"📷 Shelf Scanner"} · {scanStage==="review"?"Review items":"tap photo or browse"}</div>
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
                    🏷 Weekly Ad
                  </button>
                  <button onClick={()=>{setScanMode("whiteboard");setScanPreview(null);setScanB64(null);}}
                    style={{flex:1,padding:"12px",borderRadius:9,border:"1px solid "+(scanMode==="whiteboard"?"#8b5cf6":C.border),background:scanMode==="whiteboard"?"#8b5cf622":"transparent",color:scanMode==="whiteboard"?"#8b5cf6":C.muted,cursor:"pointer",fontFamily:FM,fontSize:13,fontWeight:700}}>
                    📝 List
                  </button>
                  <button onClick={()=>{setScanOpen(false);setTab("leftovers");}} style={{flex:1,padding:"12px",borderRadius:9,border:"1px solid #f97316",background:"transparent",color:"#f97316",cursor:"pointer",fontFamily:FM,fontSize:13,fontWeight:700}}>
                    🥡 Leftover
                  </button>
                </div>
                {scanMode==="receipt"&&(
                  <div style={{background:"#1a2018",borderRadius:10,padding:12,marginBottom:12,fontSize:seniorMode?16:12,color:C.muted,lineHeight:1.6}}>
                    📸 Lay receipt flat, good lighting, capture full receipt in frame.
                  </div>
                )}
                {scanMode==="weeklyad"&&(
                  <div style={{background:"#1a1a00",borderRadius:10,padding:12,marginBottom:12,fontSize:12,color:"#fbbf24",lineHeight:1.6}}>
                    🏷 Screenshot the weekly ad from your Meijer app, or photograph a printed flyer. Select all pages at once - Smart Kitchen will scan each page and combine results automatically.
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
                      <div style={{fontSize:32,marginBottom:8}}>{scanMode==="receipt"?"🧾":scanMode==="weeklyad"?"🏷":"📷"}</div>
                      <div style={{fontFamily:FD,fontSize:16,color:C.text}}>{scanMode==="receipt"?"Tap to photograph receipt":scanMode==="weeklyad"?"Tap to screenshot weekly ad":scanMode==="whiteboard"?"Tap to photograph your list":"Tap to photograph shelf"}</div>
                      <div style={{fontSize:12,color:C.muted,marginBottom:12}}>opens camera directly</div>
                      <button onClick={e=>{e.stopPropagation();galleryRef.current.click();}} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:8,color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:11,padding:"6px 14px"}}>{scanMode==="weeklyad"?"Select All Pages (multi-select OK)":"Choose from Gallery"}</button>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>onFile(e.target.files[0])}/>
                <input ref={galleryRef} type="file" accept="image/*" multiple={scanMode==="weeklyad"} style={{display:"none"}} onChange={e=>scanMode==="weeklyad"?onFiles(Array.from(e.target.files)):onFile(e.target.files[0])}/>
                <div style={{display:"flex",gap:8}}>
                  <button style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid "+C.border,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:12,fontWeight:600}} onClick={()=>setScanOpen(false)}>Cancel</button>
                  <button style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:scanB64?C.accent:C.border,color:scanB64?"#0c0e14":C.muted,cursor:scanB64?"pointer":"not-allowed",fontFamily:FM,fontSize:12,fontWeight:700,opacity:scanB64?1:0.5}}
                    onClick={scanMode==="receipt"?analyzeReceipt:scanMode==="weeklyad"?analyzeWeeklyAd:scanMode==="whiteboard"?analyzeWhiteboard:analyzePhoto} disabled={!scanB64}>
                    {scanMode==="receipt"?"🧾 Read Receipt":scanMode==="weeklyad"?"🏷 Extract Sale Items":scanMode==="whiteboard"?"📝 Read My List":"🔍 Analyze Photo"}
                  </button>
                </div>
              </div>
            )}
            {scanStage==="analyzing"&&(
              <div style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:48,marginBottom:16}}>⏳</div>
                <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:8}}>{scanMode==="receipt"?"Reading Receipt...":"Analyzing Photo..."}</div>
                <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:24}}>{scanMode==="receipt"?"This may take 20–45 seconds — we're reading every item and enriching product details.":"This may take 10–20 seconds"}</div>
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
                    <div key={i} style={{background:item.selected?C.surface:C.card,border:"1px solid "+(item.selected?C.accent:C.border),borderRadius:10,padding:"10px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:item.selected?8:0,cursor:"pointer"}} onClick={e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT")return;setScanResults(p=>p.map((si,sii)=>sii===i?{...si,selected:!si.selected}:si))}}>
                        <div style={{width:18,height:18,borderRadius:4,border:"2px solid "+(item.selected?C.green:C.border),background:item.selected?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>{item.selected&&"✓"}</div>
                        <div style={{flex:1}}>
                          <input style={{fontSize:13,fontWeight:600,border:"1px solid #555",borderRadius:4,padding:"2px 6px",width:"100%",background:C.surface,color:C.text}} value={item.name} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],name:e.target.value};setScanResults(updated)}} />{(item.brand||item.size||item.upc_enriched)&&<div style={{fontSize:10,color:C.green,fontFamily:FM,marginTop:3,display:"flex",gap:6,flexWrap:"wrap"}}>{item.upc_enriched&&<span style={{background:C.green+"22",borderRadius:4,padding:"1px 5px"}}>✓ UPC</span>}{item.brand&&<span style={{color:C.muted}}>{item.brand}</span>}{item.size&&<span style={{color:C.muted}}>{item.size}</span>}</div>}
                          <div style={{fontSize:11,color:C.muted,fontFamily:FM,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}><input type="number" style={{width:50,fontSize:11,border:"1px solid #555",borderRadius:3,padding:"1px 4px",background:C.surface,color:C.text}} value={item.qty} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],qty:e.target.value};setScanResults(updated)}} /><input style={{width:60,fontSize:11,border:"1px solid #555",borderRadius:3,padding:"1px 4px",background:C.surface,color:C.text}} value={item.unit} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>{const updated=[...scanResults];updated[i]={...updated[i],unit:e.target.value};setScanResults(updated)}} /> · {item.category} · {item.location||"Pantry"}{item.price?<span style={{color:"#cbd5e1",fontWeight:600,marginLeft:4}}>{item.price}</span>:""} · <span style={{padding:"1px 6px",borderRadius:10,fontSize:10,fontWeight:700,background:item.confidence==="high"?C.green+"22":item.confidence==="low"?C.red+"22":"#f59e0b22",color:item.confidence==="high"?C.green:item.confidence==="low"?C.red:"#f59e0b"}}>{item.confidence==="high"?"✓ High":item.confidence==="low"?"⚠ Low":"● Med"}</span>{item.expiryDays&&<span style={{padding:"1px 6px",borderRadius:10,fontSize:10,fontWeight:600,background:item.expiryDays<=3?C.red+"22":item.expiryDays<=7?"#f59e0b22":C.green+"22",color:item.expiryDays<=3?C.red:item.expiryDays<=7?"#f59e0b":C.green,marginLeft:2}}>⏱ {item.expiryDays<=2?"Use/freeze within "+item.expiryDays+" days":item.expiryDays<=7?"Use within "+item.expiryDays+" days":item.expiryDays+" day shelf life"}</span>}</div>
                        </div>
                        <span style={bTag(item.action==="update"?C.blue:C.green)}>{item.action==="update"?"UPDATE":"NEW"}</span>
                      </div>
                      {item.selected&&(
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4}} onClick={e=>e.stopPropagation()}>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>QTY</div><div style={{display:"flex",alignItems:"center",gap:4}}><button onClick={e=>{e.stopPropagation();setScanResults(p=>p.map((si,sii)=>sii===i?{...si,qty:Math.max(1,(parseFloat(si.qty)||1)-1)}:si))}} style={{width:32,height:32,borderRadius:6,border:"1px solid "+C.border,background:C.surface,color:C.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>-</button><input type="number" value={item.qty} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,qty:parseFloat(e.target.value)||si.qty}:si))} style={{...bInp,padding:"5px 4px",fontSize:12,width:50,textAlign:"center"}}/><button onClick={e=>{e.stopPropagation();setScanResults(p=>p.map((si,sii)=>sii===i?{...si,qty:(parseFloat(si.qty)||1)+1}:si))}} style={{width:32,height:32,borderRadius:6,border:"1px solid "+C.border,background:C.surface,color:C.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button></div></div>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>UNIT</div><input value={item.unit} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,unit:e.target.value}:si))} style={{...bInp,padding:"5px 8px",fontSize:12}}/></div>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>LOCATION</div><select value={item.location||"Pantry"} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,location:e.target.value}:si))} style={{...bInp,padding:"5px 8px",fontSize:12}}><option>Pantry</option><option>Fridge</option><option>Freezer</option></select></div>
                          <div><div style={{fontSize:9,color:C.muted,fontFamily:FM,marginBottom:3}}>CATEGORY</div><select value={item.category||"Pantry"} onChange={e=>setScanResults(p=>p.map((si,sii)=>sii===i?{...si,category:e.target.value}:si))} style={{...bInp,padding:"5px 8px",fontSize:12}}><option>Protein</option><option>Produce</option><option>Dairy</option><option>Pantry</option><option>Frozen</option><option>Grains</option><option>Condiments</option></select></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {scanMode==="weeklyad"?(
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <button style={{...bBtn("ghost"),flex:1}} onClick={()=>{setScanStage("upload");setScanResults(null);}}>Rescan</button>
                    <button style={{...bBtn("green"),flex:2}} onClick={()=>{setSaleItems(scanResults.filter(i=>i.selected).map(({selected:_,...rest})=>rest));setScanOpen(false);setScanPreview(null);setScanB64(null);setScanResults(null);setScanStage("upload");alert(scanResults.filter(i=>i.selected).length+" sale items saved!");}}>Save {scanResults.filter(i=>i.selected).length} Sale Items</button>
                  </div>
                ):scanMode==="whiteboard"?(
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <button style={{...bBtn("ghost"),flex:1}} onClick={()=>{setScanStage("upload");setScanResults(null);}}>Rescan</button>
                    <button style={{...bBtn("green"),flex:2}} onClick={()=>{const chosen=scanResults.filter(i=>i.selected);setShopping(prev=>{const added=chosen.filter(c=>!prev.some(e=>e.name.toLowerCase()===c.name.toLowerCase()));return [...prev,...added.map(c=>({name:c.name,qty:1,unit:"item",category:c.category||"Other",checked:false,source:"Whiteboard List"}))];});setScanOpen(false);setScanPreview(null);setScanB64(null);setScanResults(null);setScanStage("upload");setTab("shopping");alert(chosen.length+" item"+(chosen.length!==1?"s":"")+" added to your shopping list!");}}>🛒 Add {scanResults.filter(i=>i.selected).length} to Shopping List</button>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px",marginBottom:4,borderTop:"1px solid "+C.border}}>
                      <span style={{fontFamily:FM,fontSize:11,color:C.muted}}>{scanResults.filter(i=>i.selected).length} of {scanResults.length} items selected</span>
                      <span style={{fontFamily:FM,fontSize:11,color:C.accent,fontWeight:600}}>Est. total: ${scanResults.filter(i=>i.selected&&i.price).reduce((sum,i)=>{const p=parseFloat((i.price||"").replace(/[^0-9.]/g,""));return sum+(isNaN(p)?0:p);},0).toFixed(2)}</span>
                    </div>
                    <button style={{...bBtn("ghost"),flex:1}} onClick={()=>{setScanStage("upload");setScanResults(null);}}>Rescan</button>
                    <button style={{...bBtn("green"),flex:2}} onClick={commitScan}>Save {scanResults.filter(i=>i.selected).length} Items</button>
                  </div>
                )}
              </div>
            )}
            {scanStage==="done"&&<div style={{textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div style={{fontFamily:FD,fontSize:22,color:C.green}}>Inventory Updated!</div></div>}
          </div>
        </div>
      )}

      {/* == RECIPE MODAL == */}
      {showSeniorPrompt&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:700,padding:20}} onClick={()=>{setSeniorPromptDismissed(true);try{localStorage.setItem("sk_seniorPromptDismissed","1");}catch{}setShowSeniorPrompt(false);}}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:16,padding:28,maxWidth:360,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:10}}>👴</div>
            <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:C.accent,marginBottom:8}}>Senior-Friendly Mode</div>
            <div style={{fontFamily:FM,fontSize:15,color:C.muted,marginBottom:24,lineHeight:1.7}}>
              We noticed your profile is set to <strong style={{color:C.text}}>Senior Adult</strong>. Would you like larger text and easier navigation to make Smart Kitchen more comfortable to use?
            </div>
            <button onClick={()=>{
                setSeniorMode(true);
                setSeniorPromptDismissed(true);
                try{localStorage.setItem("sk_seniorMode","1");localStorage.setItem("sk_seniorPromptDismissed","1");}catch{}
                setShowSeniorPrompt(false);
              }}
              style={{...bBtn("primary"),width:"100%",padding:"14px",fontSize:16,marginBottom:12,borderRadius:10}}>
              ✅ Yes please — bigger text
            </button>
            <button onClick={()=>{
                setSeniorPromptDismissed(true);
                try{localStorage.setItem("sk_seniorPromptDismissed","1");}catch{}
                setShowSeniorPrompt(false);
              }}
              style={{...bBtn("ghost"),width:"100%",padding:"12px",fontSize:14,border:"1px solid "+C.border,color:C.text,borderRadius:10,marginBottom:8}}>
              No thanks — keep it as is
            </button>
            <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:4,lineHeight:1.5}}>
              You can always change this later using the <strong>🔤 Senior</strong> button in the menu.
            </div>
          </div>
        </div>
      )}

      {photoPromptMeal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:20}} onClick={()=>setPhotoPromptMeal(null)}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:16,padding:24,maxWidth:340,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:40,marginBottom:8}}>🏆</div>
            <div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:C.accent,marginBottom:6}}>5-Star Keeper!</div>
            <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>
              <strong style={{color:C.text}}>{photoPromptMeal}</strong> just earned a spot in your recipe hall of fame. Want to snap a photo to remember it?
            </div>
            <input type="file" accept="image/*" capture="environment" id="mealPhotoInput" style={{display:"none"}}
              onChange={e=>{
                const file=e.target.files?.[0];
                if(!file) return;
                const img=new Image();
                const url=URL.createObjectURL(file);
                img.onload=()=>{
                  const canvas=document.createElement("canvas");
                  const max=600;
                  const ratio=Math.min(max/img.width,max/img.height,1);
                  canvas.width=img.width*ratio;
                  canvas.height=img.height*ratio;
                  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
                  const compressed=canvas.toDataURL("image/jpeg",0.7);
                  URL.revokeObjectURL(url);
                  setMealPhotos(prev=>{
                    const next={...prev,[photoPromptMeal]:compressed};
                    try{localStorage.setItem("sk_mealPhotos",JSON.stringify(next));}catch{}
                    return next;
                  });
                  setPhotoPromptMeal(null);
                };
                img.src=url;
              }}
            />
            <button onClick={()=>document.getElementById("mealPhotoInput").click()}
              style={{...bBtn("primary"),width:"100%",padding:"12px",marginBottom:10,fontSize:14}}>
              📸 Take a Photo
            </button>
            <button onClick={()=>{
                const input=document.getElementById("mealPhotoInput");
                input.removeAttribute("capture");
                input.click();
                setTimeout(()=>input.setAttribute("capture","environment"),1000);
              }}
              style={{...bBtn("ghost"),width:"100%",padding:"10px",marginBottom:10,fontSize:13,border:"1px solid "+C.border,color:C.text}}>
              🖼 Choose from Gallery
            </button>
            <button onClick={()=>{
                const next=photoSkipCount+1;
                setPhotoSkipCount(next);
                try{localStorage.setItem("sk_photoSkipCount",String(next));}catch{}
                setPhotoPromptMeal(null);
              }}
              style={{background:"transparent",border:"none",color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer",width:"100%",padding:"8px"}}>
              {photoSkipCount>=2?"Don't ask again":"Skip for now"}
            </button>
          </div>
        </div>
      )}

{canIHaveOpen&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:16}} onClick={()=>{setCanIHaveOpen(false);setCanIHaveResult(null);setCanIHaveImg(null);setCanIHaveText("");}}>
        <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:16,padding:24,maxWidth:440,width:"100%",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:18,fontWeight:700,color:"#dc2626",fontFamily:FD}}>⚕ Can I Have This?</span>
            <button onClick={()=>{setCanIHaveOpen(false);setCanIHaveResult(null);setCanIHaveImg(null);setCanIHaveText("");}} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14,fontFamily:FM}}>Checks food against every family member's medical profile, allergies and dietary restrictions.</div>

          {/* Active profile badges */}
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:14}}>
            {activeProfiles.filter(p=>p.name).map(p=>{
              const hasMedical=can.medicalCompliance&&(p.enforcement&&((p.medicalAllergies||[]).length>0||(p.medications||[]).length>0||p.medicalPlan));
              const r=RESTRICTION_PRESETS[p.restriction];
              return(<span key={p.id} style={{fontSize:10,background:(hasMedical?"#dc262622":r?.color?r.color+"22":"#33333322"),color:(hasMedical?"#dc2626":r?.color||C.muted),padding:"2px 8px",borderRadius:10,border:"1px solid "+(hasMedical?"#dc262644":r?.color?r.color+"44":"#44444444"),fontFamily:FM}}>
                {hasMedical?"⚕":r?.icon||""} {p.name}{hasMedical?" (Medical+)":""}
              </span>);
            })}
          </div>

          {/* Text input */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginBottom:4}}>TYPE A FOOD OR INGREDIENT</div>
            <div style={{display:"flex",gap:6}}>
              <input style={{...bInp,flex:1,fontSize:13}} placeholder="e.g. grapefruit, spinach, aged cheddar..." value={canIHaveText||""} onChange={e=>setCanIHaveText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&canIHaveText?.trim()&&!canIHaveLoading)document.getElementById("cihCheckBtn").click();}}/>
            </div>
          </div>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{flex:1,height:1,background:C.border}}/>
            <span style={{fontSize:10,color:C.muted,fontFamily:FM}}>OR SCAN A LABEL</span>
            <div style={{flex:1,height:1,background:C.border}}/>
          </div>

          {/* Photo drop zone */}
          <div style={{border:"2px dashed "+(canIHaveImg?C.accent:C.border),borderRadius:10,minHeight:100,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:12,overflow:"hidden",transition:"border 0.2s"}} onClick={()=>document.getElementById("cihInput").click()}>
            {canIHaveImg
              ?<img src={canIHaveImg} alt="" style={{width:"100%",maxHeight:180,objectFit:"cover"}}/>
              :<div style={{textAlign:"center",color:C.muted,padding:16}}>
                <div style={{fontSize:32}}>📸</div>
                <div style={{fontSize:12,marginTop:6,fontFamily:FM}}>Tap to photograph a food label</div>
                <div style={{fontSize:10,marginTop:3,color:C.dim}}>Camera opens directly on mobile</div>
              </div>}
          </div>
          <input type="file" accept="image/*" capture="environment" id="cihInput" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f){const img=new Image();const url=URL.createObjectURL(f);img.onload=()=>{const canvas=document.createElement("canvas");const max=900;const ratio=Math.min(max/img.width,max/img.height,1);canvas.width=img.width*ratio;canvas.height=img.height*ratio;const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);setCanIHaveImg(canvas.toDataURL("image/jpeg",0.85));setCanIHaveResult(null);};img.src=url;}}}/>

          {/* Check button */}
          {(canIHaveImg||canIHaveText?.trim())&&!canIHaveResult&&(
            <button id="cihCheckBtn" disabled={canIHaveLoading} onClick={async()=>{
              setCanIHaveLoading(true);
              // Build full family context
              const flags=restrictedProfiles.flatMap(p=>RESTRICTION_PRESETS[p.restriction]?.flags||[]);
              const dietChecks=[];
              if(flags.includes("zero-sugar")) dietChecks.push("ZERO sugar");
              if(flags.includes("low-carb")) dietChecks.push("low carb");
              if(flags.includes("low-sodium")) dietChecks.push("low sodium");
              if(flags.includes("low-potassium")) dietChecks.push("low potassium");
              if(flags.includes("low-phosphorus")) dietChecks.push("low phosphorus");
              if(flags.includes("limit-protein")) dietChecks.push("limited protein");
              if(flags.includes("low-saturated-fat")) dietChecks.push("low saturated fat");
              const medContext=can.medicalCompliance?activeProfiles.filter(p=>p.enforcement&&((p.medications||[]).length>0||(p.medicalAllergies||[]).length>0||p.medicalPlan)).map(p=>{
                const parts=[];
                const allAllergies=[...(p.medicalAllergies||[])];
                if(p.medicalAllergiesCustom) allAllergies.push(p.medicalAllergiesCustom);
                if(allAllergies.length) parts.push("ALLERGIES (HARD STOP): "+allAllergies.join(", "));
                if(p.medicalPlan) parts.push("Dietary Plan: "+p.medicalPlan);
                if((p.medications||[]).length) parts.push("Medications: "+p.medications.filter(m=>m.name).map(m=>m.name+(m.dose?" "+m.dose:"")+(m.schedule?" "+m.schedule:"")).join(", "));
                return (p.name||"Member")+" [Enforcement: "+(p.enforcement)+"] — "+parts.join("; ");
              }).join(" | "):"";
              const prompt=canIHaveText?.trim()
                ?("Food to check: "+JSON.stringify(canIHaveText.trim())+". "+(dietChecks.length?"Dietary restrictions: "+dietChecks.join(", ")+". ":"")+(medContext?"Medical profiles: "+medContext+". ":"")+"For each family member with restrictions, evaluate safety. Return JSON.")
                :"Analyze this food label photo. "+(dietChecks.length?"Dietary restrictions: "+dietChecks.join(", ")+". ":"")+(medContext?"Medical profiles: "+medContext+". ":"")+"Identify all ingredients and evaluate safety for each member. Return JSON.";
              const res=await callClaude({
                system:'Food safety checker for a family meal planning app. Return ONLY valid JSON, no markdown. Format: {overall:"YES"|"LIMITED"|"NO", summary:"one sentence", members:[{name:"string",verdict:"YES"|"LIMITED"|"NO",reason:"short reason"}]}. If no specific members have restrictions, use members:[{name:"Everyone",verdict:"YES"|"LIMITED"|"NO",reason:"short reason"}]. Be specific about which ingredient causes the concern.',
                prompt,
                ...(canIHaveImg?{imageBase64:canIHaveImg.split(",")[1],imageType:"image/jpeg"}:{}),
                maxTokens:600
              });
              try{
                const raw=(typeof res==="string"?res:res?.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
                const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
                setCanIHaveResult(JSON.parse(raw.slice(s,e+1)));
              }catch{
                setCanIHaveResult({overall:"NO",summary:"Could not read the label. Try better lighting or type the food name.",members:[]});
              }
              setCanIHaveLoading(false);
            }} style={{width:"100%",padding:"13px",background:"#dc2626",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer",marginBottom:10,fontSize:14,fontFamily:FM,opacity:canIHaveLoading?0.7:1}}>
              {canIHaveLoading?"⚕ Checking all profiles...":"⚕ Check This Food"}
            </button>
          )}

          {/* Results */}
          {canIHaveResult&&(
            <div>
              {/* Overall verdict banner */}
              <div style={{background:canIHaveResult.overall==="YES"?"#14532d":canIHaveResult.overall==="LIMITED"?"#d97706":"#dc2626",borderRadius:10,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:36,lineHeight:1}}>{canIHaveResult.overall==="YES"?"✅":canIHaveResult.overall==="LIMITED"?"⚠":"❌"}</div>
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:"#fff",fontFamily:FD}}>{canIHaveResult.overall==="YES"?"Safe to Eat":canIHaveResult.overall==="LIMITED"?"Use Caution":"Not Recommended"}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.85)",marginTop:2}}>{canIHaveResult.summary}</div>
                </div>
              </div>

              {/* Per-member breakdown */}
              {(canIHaveResult.members||[]).length>0&&(
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontFamily:FM,color:C.muted,marginBottom:6}}>PER MEMBER</div>
                  {canIHaveResult.members.map((m,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 10px",borderRadius:8,marginBottom:4,background:m.verdict==="YES"?C.green+"11":m.verdict==="LIMITED"?"#d9770611":"#dc262611",border:"1px solid "+(m.verdict==="YES"?C.green+"33":m.verdict==="LIMITED"?"#d9770633":"#dc262633")}}>
                      <span style={{fontSize:16,lineHeight:1.4}}>{m.verdict==="YES"?"✅":m.verdict==="LIMITED"?"⚠":"❌"}</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:FM}}>{m.name}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:1}}>{m.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setCanIHaveResult(null);setCanIHaveImg(null);setCanIHaveText("");}} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid "+C.border,borderRadius:6,color:C.muted,cursor:"pointer",fontFamily:FM,fontSize:12}}>🔄 Check Another</button>
                <button onClick={()=>{setCanIHaveOpen(false);setCanIHaveResult(null);setCanIHaveImg(null);setCanIHaveText("");}} style={{flex:1,padding:"10px",background:C.accent,border:"none",borderRadius:6,color:"#000",cursor:"pointer",fontFamily:FM,fontSize:12,fontWeight:700}}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>}
            {activeRecipe&&(
        <div style={{position:"fixed",inset:0,background:"#000b",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}} onClick={()=>setActiveRecipe(null)}>
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,borderRadius:16,padding:22,maxWidth:500,width:"100%",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontFamily:FD,fontSize:24,lineHeight:1.3,flex:1}}>{activeRecipe.name}</div>
              <button onClick={()=>setActiveRecipe(null)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            {(()=>{const warns=getMedicalWarnings(activeRecipe.name);if(!warns.length)return null;return(<div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:10}}>{warns.filter(w=>w.enforcement==="strict").map((w,i)=>(<div key={"rs"+i} style={{fontSize:11,background:"#dc2626",color:"#fff",padding:"5px 10px",borderRadius:6,fontFamily:FM,display:"flex",alignItems:"center",gap:6,border:"1px solid #991b1b"}}>🚫 <span><strong>{w.member}</strong> — {w.msg}</span></div>))}{warns.filter(w=>w.enforcement==="warn").map((w,i)=>(<div key={"rw"+i} style={{fontSize:11,background:"#d97706",color:"#fff",padding:"5px 10px",borderRadius:6,fontFamily:FM,display:"flex",alignItems:"center",gap:6,border:"1px solid #b45309"}}>⚠ <span><strong>{w.member}</strong> — {w.msg}</span></div>))}</div>);})()}
            {mealPhotos[activeRecipe.name]&&<div style={{marginBottom:12}}><img src={mealPhotos[activeRecipe.name]} alt={activeRecipe.name} style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10,border:"1px solid "+C.borderLight}} /></div>}
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
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button style={{...bBtn("ghost"),flex:1,padding:10,fontSize:12}} onClick={()=>printRecipeCard(activeRecipe,mealPhotos[activeRecipe.name])}>&#128424; Print</button>
              <button style={{...bBtn("primary"),flex:3,padding:12}} onClick={()=>cookRecipe(activeRecipe)}>🍳 I Cooked This — Update Inventory</button>
            </div>
        </div>
      </div>
      )}

      {/* == DESSERT MODAL == */}
      {activeDessert&&(
        <div style={{position:"fixed",inset:0,background:"#000b",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}} onClick={()=>setActiveDessert(null)}>
          <div style={{background:C.surface,border:"1px solid "+C.accent+"66",borderRadius:16,padding:22,maxWidth:500,width:"100%",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontFamily:FD,fontSize:24,lineHeight:1.3,flex:1,color:C.accent}}>{activeDessert.name}</div>
              <button onClick={()=>setActiveDessert(null)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            {mealPhotos[activeDessert.name]&&<div style={{marginBottom:12}}><img src={mealPhotos[activeDessert.name]} alt={activeDessert.name} style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10,border:"1px solid "+C.borderLight}} /></div>}
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
              <button style={{...bBtn("ghost"),padding:"10px 14px",fontSize:12}} onClick={()=>printRecipeCard(activeDessert,mealPhotos[activeDessert.name])}>&#128424; Print</button>
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
      
      {tab==="leftovers"&&(
        <div style={{maxWidth:700,margin:"0 auto",padding:"0 8px"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:seniorMode?22:16,fontWeight:700,color:C.accent,marginBottom:4}}>🥡 Leftovers Scanner</div>
            <div style={{fontSize:seniorMode?15:12,color:C.muted}}>Photograph your leftover container — Smart Kitchen will identify the dish, estimate servings, and set a use-by date so nothing gets wasted.</div>
          </div>

          {!leftoversOpen&&!leftoversPreview&&(
            <button style={{...bBtn("primary"),marginBottom:24,fontSize:seniorMode?16:13}} onClick={()=>setLeftoversOpen(true)}>
              📷 Scan Leftover Container
            </button>
          )}

          {leftoversOpen&&(
            <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Take a photo of your leftover container or select from gallery</div>
              <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <label style={{...bBtn("primary"),cursor:"pointer",fontSize:12,display:"inline-block"}}>
                  📷 Camera
                  <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{
                    const file=e.target.files[0]; if(!file) return;
                    const b64=await fileToBase64(file);
                    setLeftoversMime(file.type||"image/jpeg"); setLeftoversB64(b64); setLeftoversPreview(URL.createObjectURL(file));
                    setLeftoversResult(null); setLeftoversError("");
                  }}/>
                </label>
                <label style={{...bBtn("ghost"),cursor:"pointer",fontSize:12,display:"inline-block"}}>
                  🖼 Gallery
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                    const file=e.target.files[0]; if(!file) return;
                    const b64=await fileToBase64(file);
                    setLeftoversMime(file.type||"image/jpeg"); setLeftoversB64(b64); setLeftoversPreview(URL.createObjectURL(file));
                    setLeftoversResult(null); setLeftoversError("");
                  }}/>
                </label>
                <button style={{...bBtn("ghost"),fontSize:12}} onClick={()=>{setLeftoversOpen(false);setLeftoversPreview(null);setLeftoversB64(null);setLeftoversResult(null);}}>Cancel</button>
              </div>

              {leftoversPreview&&(
                <div style={{marginBottom:12}}>
                  <img src={leftoversPreview} alt="Leftover" style={{width:"100%",maxHeight:220,objectFit:"cover",borderRadius:8,border:"1px solid "+C.border}}/>
                </div>
              )}

              {leftoversB64&&!leftoversResult&&(
                <button style={{...bBtn("primary"),fontSize:13,width:"100%"}} disabled={leftoversLoading} onClick={async()=>{
                  setLeftoversLoading(true); setLeftoversError("");
                  try{
                    const res=await callClaude({
                      system:`You are a food identification AI. The user has photographed a container of leftovers. 
Identify the dish, estimate servings remaining, and set a realistic use-by date.
Respond ONLY with valid JSON: {"dish":"name of the dish","servings":2,"useDays":3,"notes":"any relevant storage tip","confidence":"high|medium|low"}
useDays is days from today the food is safe to eat (cooked food: 3-4 days typical).`,
                      prompt:"What leftovers are in this container? Estimate servings and use-by days.",
                      imageBase64:leftoversB64,
                      imageType:leftoversMime,
                      maxTokens:800
                    });
                    const text=(typeof res==="string"?res:res?.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
                    const jsonMatch=text.match(/\{[\s\S]*\}/);
                    if(!jsonMatch){setLeftoversError("Smart Kitchen couldn’t read the response — try again.");setLeftoversLoading(false);return;}
                    const parsed=JSON.parse(jsonMatch[0]);
                    if(!parsed.dish){setLeftoversError("Dish name missing from response — try a clearer photo.");setLeftoversLoading(false);return;}
                    // Detect unrecognized dish — low confidence or generic name
                    const unknownNames=["unknown","unidentified","unclear","can't tell","cannot tell","not sure","food","dish","leftovers","meal","container"];
                    const isUnknown=parsed.confidence==="low"||unknownNames.some(u=>parsed.dish.toLowerCase().includes(u));
                    if(isUnknown){
                      setLeftoversUnknown(true);
                      setLeftoversManualName("");
                      // Still store partial result for servings/useDays
                      setLeftoversResult({...parsed,dish:""});
                    } else {
                      setLeftoversResult(parsed);
                    }
                  }catch(e){
                    const msg=e.message&&e.message.toLowerCase().includes("timeout")
                      ?"Connection timed out — try again with a stronger WiFi or cellular signal, or add this leftover manually."
                      :"Couldn't identify the dish. Try a clearer photo or better lighting and try again.";
                    setLeftoversError(msg);
                  }
                  setLeftoversLoading(false);
                }}>
                  {leftoversLoading?"🔍 Identifying...":"🔍 Identify & Save"}
                </button>
              )}

              {leftoversError&&<div style={{color:"#f66",fontSize:12,marginTop:8}}>{leftoversError}</div>}

              {/* Unknown dish — ask user */}
              {leftoversUnknown&&(
                <div style={{background:"#f59e0b11",border:"2px solid #f59e0b44",borderRadius:12,padding:16,marginTop:12}}>
                  <div style={{fontFamily:FM,fontSize:seniorMode?16:13,fontWeight:700,color:"#d97706",marginBottom:8}}>🤔 I'm not sure what this is</div>
                  <div style={{fontFamily:FM,fontSize:seniorMode?14:12,color:C.muted,marginBottom:12,lineHeight:1.5}}>I can see food in the container but I'm not confident what dish it is. What did you make?</div>
                  <input
                    autoFocus
                    placeholder="e.g. Orzo Salad, Chicken Stir Fry, What did you make?"
                    value={leftoversManualName}
                    onChange={e=>setLeftoversManualName(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==="Enter"&&leftoversManualName.trim()){
                        setLeftoversResult(r=>({...r,dish:leftoversManualName.trim()}));
                        setLeftoversUnknown(false);
                      }
                    }}
                    style={{width:"100%",background:C.surface,border:"2px solid #f59e0b",borderRadius:8,
                      padding:"10px 12px",color:C.text,fontFamily:FM,fontSize:seniorMode?16:13,
                      boxSizing:"border-box",marginBottom:10,outline:"none"}}/>
                  <div style={{display:"flex",gap:8}}>
                    <button
                      onClick={()=>{setLeftoversUnknown(false);setLeftoversResult(null);setLeftoversB64(null);setLeftoversPreview(null);}}
                      style={{...bBtn("ghost"),flex:1,padding:"9px",fontSize:12}}>Try Again</button>
                    <button
                      disabled={!leftoversManualName.trim()}
                      onClick={()=>{
                        setLeftoversResult(r=>({...r,dish:leftoversManualName.trim()}));
                        setLeftoversUnknown(false);
                      }}
                      style={{...bBtn("primary"),flex:2,padding:"9px",fontSize:13,
                        opacity:leftoversManualName.trim()?1:0.5}}>
                      That's What It Is ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {leftoversResult&&leftoversResult.dish&&(
            <div style={{background:C.card,border:"2px solid "+C.accent,borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,color:C.accent,marginBottom:12}}>✅ Leftover Identified</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div style={{background:C.bg,borderRadius:8,padding:10}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>DISH</div>
                  <input style={{background:"transparent",border:"none",borderBottom:"1px solid "+C.border,color:C.text,fontFamily:FM,fontSize:15,fontWeight:700,width:"100%",outline:"none",padding:"2px 0"}} value={leftoversResult.dish} onChange={e=>setLeftoversResult(r=>({...r,dish:e.target.value}))}/>
                </div>
                <div style={{background:C.bg,borderRadius:8,padding:10}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>SERVINGS</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.text}}>{leftoversResult.servings} serving{leftoversResult.servings!==1?"s":""}</div>
                </div>
                <div style={{background:leftoversResult.useDays<=2?"#3d1a1a":"#1a2e1a",borderRadius:8,padding:10}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>USE BY</div>
                  <div style={{fontSize:13,fontWeight:700,color:leftoversResult.useDays<=2?"#f66":"#4c4"}}>
                    {new Date(Date.now()+leftoversResult.useDays*86400000).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                    {leftoversResult.useDays<=2?" ⚠ Soon!":" ✓"}
                  </div>
                </div>
                <div style={{background:C.bg,borderRadius:8,padding:10}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>CONFIDENCE</div>
                  <div style={{fontSize:13,fontWeight:700,color:leftoversResult.confidence==="high"?"#4c4":leftoversResult.confidence==="medium"?"#fa0":"#f66"}}>{leftoversResult.confidence?.toUpperCase()}</div>
                </div>
              </div>
              {leftoversResult.notes&&<div style={{fontSize:12,color:C.muted,marginBottom:12,fontStyle:"italic"}}>💡 {leftoversResult.notes}</div>}
              <button style={{...bBtn("primary"),width:"100%",fontSize:13}} onClick={()=>{
                const useByDate=new Date(Date.now()+leftoversResult.useDays*86400000).toLocaleDateString("en-US",{month:"short",day:"numeric"});
                const saveLeftover=(photoDataUrl)=>{
                  const newItem={
                    id:Date.now(),
                    name:leftoversResult.dish,
                    qty:leftoversResult.servings,
                    unit:"serving",
                    category:"Leftovers",
                    location:"Fridge",
                    useBy:useByDate,
                    useDays:leftoversResult.useDays,
                    isLeftover:true,
                    addedAt:new Date().toISOString(),
                    photo:photoDataUrl||null
                  };
                  setInventory(prev=>[...prev,newItem]);
                  setLeftoversResult(null);
                  setLeftoversPreview(null);
                  setLeftoversB64(null);
                  setLeftoversOpen(false);
                };
                const dishName=leftoversResult.dish;
                if(leftoversB64){
                  const img=new Image();
                  img.onload=()=>{
                    const canvas=document.createElement("canvas");
                    const max=400;
                    const ratio=Math.min(max/img.width,max/img.height,1);
                    canvas.width=img.width*ratio;canvas.height=img.height*ratio;
                    canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
                    saveLeftover(canvas.toDataURL("image/jpeg",0.65));
                    setLeftoverSavedCue({dishName,useByDate});
                  };
                  img.onerror=()=>{saveLeftover(leftoversPreview||null);setLeftoverSavedCue({dishName,useByDate});};
                  img.src="data:"+leftoversMime+";base64,"+leftoversB64;
                } else if(leftoversPreview){
                  saveLeftover(leftoversPreview);
                  setLeftoverSavedCue({dishName,useByDate});
                } else {
                  saveLeftover(null);
                  setLeftoverSavedCue({dishName,useByDate});
                }
              }}>
                💾 Save to Inventory
              </button>
              <button style={{...bBtn("ghost"),width:"100%",fontSize:12,marginTop:8}} onClick={()=>{setLeftoversResult(null);setLeftoversPreview(null);setLeftoversB64(null);}}>
                Try Again
              </button>
            </div>
          )}

          {/* Existing leftovers in inventory */}
          {inventory.filter(i=>i.category==="Leftovers"||i.isLeftover).length>0&&(
            <div>
              <div style={{fontSize:seniorMode?16:12,fontWeight:700,color:C.muted,letterSpacing:0.8,marginBottom:8,marginTop:8}}>CURRENT LEFTOVERS</div>
              {inventory.filter(i=>i.category==="Leftovers"||i.isLeftover).map((item,idx)=>{
                const daysLeft=item.useDays?Math.ceil((new Date(item.addedAt).getTime()+item.useDays*86400000-Date.now())/86400000):null;
                const urgent=daysLeft!==null&&daysLeft<=1;
                const warning=daysLeft!==null&&daysLeft<=2;
                return(
                  <div key={idx} style={{background:C.card,border:"1px solid "+(urgent?"#f66":warning?"#fa0":C.border),borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",flex:1}}>
                      {item.photo&&<img src={item.photo} alt={item.name} style={{width:seniorMode?72:56,height:seniorMode?72:56,objectFit:"cover",borderRadius:8,flexShrink:0,border:"1px solid "+C.border}} />}
                      <div>
                        <div style={{fontSize:seniorMode?20:14,fontWeight:600,color:C.text}}>{item.name}</div>
                        <div style={{fontSize:seniorMode?16:11,color:C.muted}}>{item.qty} {item.unit}{item.useBy?" · Use by "+item.useBy:""}</div>
                        {urgent&&<span style={{fontSize:seniorMode?15:10,color:"#f66",fontWeight:700}}>⚠ Use TODAY</span>}
                        {warning&&!urgent&&<span style={{fontSize:seniorMode?15:10,color:"#fa0",fontWeight:700}}>⚠ Use SOON</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {item._askMealType?(
                        <>
                          <span style={{fontSize:seniorMode?15:10,color:C.muted}}>Used as:</span>
                          <button style={{background:"#1a3a1a",border:"1px solid #4c4",borderRadius:6,color:"#4c4",cursor:"pointer",fontSize:seniorMode?15:10,padding:seniorMode?"5px 14px":"3px 8px"}} onClick={()=>{
                            const log=JSON.parse(localStorage.getItem("sk_leftoverHistory")||"[]");
                            log.push({dish:item.name,servings:item.qty,consumedAs:"dinner",daysSinceAdded:item.useDays?Math.ceil((Date.now()-new Date(item.addedAt).getTime())/86400000):null,wasted:false,ts:Date.now()});
                            localStorage.setItem("sk_leftoverHistory",JSON.stringify(log));
                            setInventory(prev=>prev.filter(it=>it.id!==item.id));
                          }}>Dinner</button>
                          <button style={{background:"#1a2e3a",border:"1px solid "+C.blue,borderRadius:6,color:C.blue,cursor:"pointer",fontSize:seniorMode?15:10,padding:seniorMode?"5px 14px":"3px 8px"}} onClick={()=>{
                            const log=JSON.parse(localStorage.getItem("sk_leftoverHistory")||"[]");
                            log.push({dish:item.name,servings:item.qty,consumedAs:"lunch",daysSinceAdded:item.useDays?Math.ceil((Date.now()-new Date(item.addedAt).getTime())/86400000):null,wasted:false,ts:Date.now()});
                            localStorage.setItem("sk_leftoverHistory",JSON.stringify(log));
                            setInventory(prev=>prev.filter(it=>it.id!==item.id));
                          }}>Lunch</button>
                        </>
                      ):(
                        <>
                          <button style={{background:"#1a3a1a",border:"1px solid #4c4",borderRadius:6,color:"#4c4",cursor:"pointer",fontSize:seniorMode?15:10,padding:"3px 8px"}} onClick={()=>setInventory(prev=>prev.map(it=>it.id===item.id?{...it,_askMealType:true}:it))}>Used</button>
                          <button style={{background:"transparent",border:"1px solid "+C.border,borderRadius:6,color:C.muted,cursor:"pointer",fontSize:seniorMode?15:10,padding:seniorMode?"5px 14px":"3px 8px"}} onClick={()=>{
                            const log=JSON.parse(localStorage.getItem("sk_leftoverHistory")||"[]");
                            log.push({dish:item.name,servings:item.qty,consumedAs:null,wasted:true,reason:null,ts:Date.now()});
                            localStorage.setItem("sk_leftoverHistory",JSON.stringify(log));
                            setInventory(prev=>prev.filter(it=>it.id!==item.id));
                          }}>Remove</button>
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab==="substitute"&&(
        <div style={{maxWidth:700,margin:"0 auto",padding:"0 8px"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:seniorMode?22:16,fontWeight:700,color:C.accent,marginBottom:4}}>🔄 Can I Substitute This?</div>
            <div style={{fontSize:seniorMode?15:12,color:C.muted}}>Out of an ingredient? Type it below and Smart Kitchen will check your pantry and suggest the best substitution with exact measurements.</div>
          </div>

          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input
                style={{flex:1,background:C.bg,border:"1px solid "+C.border,borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:FM,fontSize:seniorMode?16:14,outline:"none"}}
                placeholder="e.g. brown sugar, buttermilk, baking powder..."
                value={subQuery}
                onChange={e=>setSubQuery(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&subQuery.trim()&&!subLoading&&(async()=>{
                  setSubLoading(true); setSubError(""); setSubResult(null);
                  const invList=inventory.map(i=>i.name).join(", ");
                  try{
                    const res=await callClaude({
                      system:`You are a culinary substitution expert. The user needs a substitution for an ingredient.
You have access to their current pantry inventory.
Provide practical substitutions prioritizing what they already have.
Respond ONLY with valid JSON:
{
  "ingredient": "the ingredient they need",
  "makeIt": {"possible": true/false, "ingredients": ["item + amount"], "instructions": "how to make it", "ratio": "e.g. 1:1"},
  "swapWith": [{"item": "alternative", "ratio": "measurement conversion", "note": "when this works best", "inInventory": true/false}],
  "warning": "any important notes about when substitutions won't work well"
}`,
                      prompt:`I need to substitute: ${subQuery}

My current inventory includes: ${invList}

What can I substitute and do I have what I need?`,
                      maxTokens:600
                    });
                    const text=(typeof res==="string"?res:res?.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
                    const jm=text.match(/{[\s\S]*}/);
                    setSubResult(JSON.parse(jm?jm[0]:text));
                  }catch(e){setSubError("Could not find substitution. Try being more specific.");}
                  setSubLoading(false);
                })()}
              />
              <button style={{...bBtn("primary"),fontSize:13,whiteSpace:"nowrap"}} disabled={subLoading||!subQuery.trim()} onClick={async()=>{
                setSubLoading(true); setSubError(""); setSubResult(null);
                const invList=inventory.map(i=>i.name).join(", ");
                try{
                  const res=await callClaude({
                    system:`You are a culinary substitution expert. The user needs a substitution for an ingredient.
You have access to their current pantry inventory.
Provide practical substitutions prioritizing what they already have.
Respond ONLY with valid JSON:
{
  "ingredient": "the ingredient they need",
  "makeIt": {"possible": true/false, "ingredients": ["item + amount"], "instructions": "how to make it", "ratio": "e.g. 1:1"},
  "swapWith": [{"item": "alternative", "ratio": "measurement conversion", "note": "when this works best", "inInventory": true/false}],
  "warning": "any important notes about when substitutions won't work well"
}`,
                    prompt:`I need to substitute: ${subQuery}

My current inventory includes: ${invList}

What can I substitute and do I have what I need?`,
                    maxTokens:600
                  });
                  const text=(typeof res==="string"?res:res?.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
                  const jmk=text.match(/{[\s\S]*}/);
                  setSubResult(JSON.parse(jmk?jmk[0]:text));
                }catch(e){setSubError("Could not find substitution. Try being more specific.");}
                setSubLoading(false);
              }}>
                {subLoading?"🔍 Checking...":"🔍 Find Sub"}
              </button>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["brown sugar","buttermilk","baking powder","eggs","heavy cream","bread crumbs"].map(s=>(
                <button key={s} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:16,padding:"4px 10px",fontSize:11,color:C.muted,cursor:"pointer"}} onClick={()=>setSubQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {subError&&<div style={{color:"#f66",fontSize:13,marginBottom:12}}>{subError}</div>}

          {subResult&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>Substitutions for: <span style={{color:C.accent}}>{subResult.ingredient}</span></div>

              {subResult.makeIt?.possible&&(
                <div style={{background:C.card,border:"2px solid #4c4",borderRadius:12,padding:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#4c4",marginBottom:8}}>✨ MAKE IT YOURSELF</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {(subResult.makeIt.ingredients||[]).map((ing,i)=>{
                      const inStock=inventory.some(item=>item.name.toLowerCase().includes(ing.split(" ")[ing.split(" ").length-1].toLowerCase()));
                      return<span key={i} style={{background:inStock?"#1a3a1a":"#3a1a1a",border:"1px solid "+(inStock?"#4c4":"#f66"),borderRadius:6,padding:"3px 8px",fontSize:12,color:inStock?"#4c4":"#f99"}}>{inStock?"✓":"✗"} {ing}</span>;
                    })}
                  </div>
                  {subResult.makeIt.instructions&&<div style={{fontSize:13,color:C.text,marginBottom:6}}>{subResult.makeIt.instructions}</div>}
                  {subResult.makeIt.ratio&&<div style={{fontSize:11,color:C.muted}}>Ratio: {subResult.makeIt.ratio}</div>}
                </div>
              )}

              {(subResult.swapWith||[]).length>0&&(
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>SWAP WITH SOMETHING ELSE</div>
                  {subResult.swapWith.map((swap,i)=>{
                    const inStock=inventory.some(item=>item.name.toLowerCase().includes(swap.item?.toLowerCase()?.split(" ")[0]||""));
                    return(
                      <div key={i} style={{borderBottom:i<subResult.swapWith.length-1?"1px solid "+C.border:"none",paddingBottom:i<subResult.swapWith.length-1?10:0,marginBottom:i<subResult.swapWith.length-1?10:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <span style={{fontSize:14,fontWeight:600,color:C.text}}>{swap.item}</span>
                          <span style={{fontSize:11,background:inStock?"#1a3a1a":"#2a2a2a",color:inStock?"#4c4":C.muted,border:"1px solid "+(inStock?"#4c4":C.border),borderRadius:10,padding:"2px 8px"}}>{inStock?"✓ In Stock":"Not in pantry"}</span>
                        </div>
                        {swap.ratio&&<div style={{fontSize:12,color:C.accent,marginBottom:2}}>📏 {swap.ratio}</div>}
                        {swap.note&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>{swap.note}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {subResult.warning&&(
                <div style={{background:"#2a2000",border:"1px solid #fa0",borderRadius:10,padding:12}}>
                  <div style={{fontSize:12,color:"#fa0"}}>⚠ {subResult.warning}</div>
                </div>
              )}

              <button style={{...bBtn("ghost"),fontSize:12}} onClick={()=>{setSubResult(null);setSubQuery("");}}>
                Search Another Ingredient
              </button>
            </div>
          )}
        </div>
      )}

{printModal&&(
        <div style={{position:"fixed",inset:0,background:"#000d",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"white",color:"#111",borderRadius:14,padding:24,maxWidth:660,width:"100%",maxHeight:"90vh",overflowY:"auto",fontFamily:"Arial, sans-serif"}}>
            <div id="sk-no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,borderBottom:"2px solid #eee",paddingBottom:12}}>
              <div>
                <div style={{fontSize:17,fontWeight:"bold"}}>{printModal==="mealplan"?"🍽 Meal Plan":"🛒 Shopping List"}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>Press <strong>Ctrl+P</strong> (Win) or <strong>Cmd+P</strong> (Mac) to print</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{const c=document.getElementById("sk-print-content");if(!c)return;const w=window.open("","_blank","width=750,height=900");w.document.write("<html><head><title>Smart Kitchen</title><style>body{font-family:Arial,sans-serif;padding:32px 40px;color:#111;margin:0;}@page{margin:1cm;size:portrait;}h1{font-size:28px;font-weight:bold;margin:0 0 4px 0;color:#1A2344;}h2{font-size:22px;font-weight:bold;margin:6px 0;}h3{font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px 0;font-weight:normal;}.date{font-size:14px;color:#888;margin-bottom:20px;}.summary{background:#f5f5f5;border-radius:6px;padding:10px 16px;margin-bottom:20px;font-size:15px;}.day-card{border:2px solid #e2e6ef;border-radius:8px;padding:14px 18px;margin-bottom:12px;page-break-inside:avoid;}.day-name{font-size:22px;font-weight:bold;color:#1A2344;margin-bottom:2px;}.meal-name{font-size:18px;font-weight:bold;color:#C8963E;margin-bottom:6px;}.details{font-size:14px;color:#555;margin-bottom:4px;}.need{font-size:14px;color:#c00;}.good{font-size:14px;color:#080;}.brand{font-size:12px;color:#aaa;margin-top:24px;text-align:center;border-top:1px solid #eee;padding-top:12px;}</style></head><body>"+c.innerHTML+"</body></html>");w.document.close();w.focus();setTimeout(()=>{w.print();w.close();},400);}} style={{background:"#f0a500",border:"none",borderRadius:8,padding:"8px 18px",fontWeight:"bold",cursor:"pointer",fontSize:13}}>🖨 Print Now</button>
                <button onClick={()=>setPrintModal(null)} style={{background:"#eee",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13}}>✕</button>
              </div>
            </div>
            <div id="sk-print-content">
              {printModal==="mealplan"&&(
                <div>
                  <h1>Smart Kitchen™ — Weekly Meal Plan</h1>
                  <div className="date">Week of {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
                  {mealPlan.filter(d=>d.proteinUsed).length>0&&(
                    <div className="summary">
                      <strong>This week:</strong> {mealPlan.filter(d=>d.proteinUsed).map((d,i)=><span key={i}>{d.day?.slice(0,3)}: {d.proteinUsed}{i<mealPlan.filter(x=>x.proteinUsed).length-1?" · ":""}</span>)}
                    </div>
                  )}
                  {mealPlan.map((day,i)=>(
                    <div key={i} className="day-card">
                      <h3>Day {i+1}</h3>
                      <div className="day-name">{day.day}</div>
                      <div className="meal-name">{day.meal}</div>
                      <div className="details">{[day.proteinUsed&&"🥩 "+day.proteinUsed,(day.sauteBagsUsed||0)>0&&"🫕 Saute blend: "+day.sauteBagsUsed+" bag",day.sideUsed&&"🥦 "+day.sideUsed].filter(Boolean).join("  ·  ")}</div>
                      {(day.shoppingNeeded||[]).length===0?<div className="good">✅ All ingredients on hand</div>:<div className="need">🛒 Need: {(day.shoppingNeeded||[]).map(s=>s.qty+" "+s.unit+" "+s.name).join(", ")}</div>}
                    </div>
                  ))}
                  <div className="brand">smart-kitchen-opal.vercel.app · Printed {new Date().toLocaleDateString()}</div>
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
      {/* == MAKE THIS MODAL == */}




      {/* -- Share Recipe Modal -- */}
      {showShareModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:700,padding:16}} onClick={()=>{if(!shareLoading){setShowShareModal(false);if(!shareResult){setShareSelected({});setShareMode(false);}}}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:24,maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

            {!shareResult?(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontFamily:FD,fontSize:20,color:C.accent}}>📤 Share Recipes</div>
                  <button onClick={()=>setShowShareModal(false)} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,cursor:"pointer",fontSize:15,padding:"3px 9px"}}>x</button>
                </div>

                {/* Recipe list preview */}
                <div style={{background:C.surface,borderRadius:10,padding:12,marginBottom:16}}>
                  <div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>
                    SHARING {Object.keys(shareSelected).length} RECIPE{Object.keys(shareSelected).length>1?"S":""}
                  </div>
                  {Object.values(shareSelected).map((r,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:14}}>{r.isFamilyRecipe?"📖":"⭐"}</span>
                      <span style={{fontFamily:FM,fontSize:13,color:C.text}}>{r.name}</span>
                      <button onClick={()=>setShareSelected(prev=>{const next={...prev};delete next[r.name];return next;})}
                        style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12,marginLeft:"auto"}}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Collection title */}
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>
                    Collection name <span style={{fontWeight:400,color:C.muted}}>(optional)</span>
                  </div>
                  <input
                    placeholder={(familyProfiles[0]?.name||"My")+"'s Recipe Collection"}
                    value={shareTitle}
                    onChange={e=>setShareTitle(e.target.value)}
                    style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:8,
                      padding:"8px 10px",color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box"}}/>
                </div>

                <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginBottom:16,lineHeight:1.5}}>
                  Creates a shareable link valid for 90 days. Anyone with the link can view your recipes.
                  Smart Kitchen users can import them in one tap.
                </div>

                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setShowShareModal(false)} style={{...bBtn("ghost"),flex:1,padding:"10px"}}>Cancel</button>
                  <button onClick={shareRecipes} disabled={shareLoading||!Object.keys(shareSelected).length}
                    style={{...bBtn("primary"),flex:2,padding:"10px",fontSize:14,opacity:shareLoading?0.7:1}}>
                    {shareLoading?"Creating link...":"Create Share Link"}
                  </button>
                </div>
              </div>
            ):(
              <div>
                <div style={{textAlign:"center",marginBottom:16}}>
                  <div style={{fontSize:40,marginBottom:8}}>🎉</div>
                  <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:4}}>Link Created!</div>
                  <div style={{fontFamily:FM,fontSize:13,color:C.muted}}>
                    {Object.keys(shareSelected).length} recipe{Object.keys(shareSelected).length>1?"s":""} ready to share
                  </div>
                </div>

                {/* Share code */}
                <div style={{background:C.surface,borderRadius:12,padding:16,marginBottom:14,textAlign:"center"}}>
                  <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginBottom:6}}>SHARE CODE</div>
                  <div style={{fontFamily:FD,fontSize:28,color:C.accent,letterSpacing:4,marginBottom:8}}>
                    {shareResult.shareCode}
                  </div>
                  <div style={{fontFamily:FM,fontSize:11,color:C.muted}}>Valid for 90 days</div>
                </div>

                {/* Action buttons */}
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <button onClick={()=>{navigator.clipboard.writeText(shareResult.shareUrl);setShareCopied(true);setTimeout(()=>setShareCopied(false),3000);}}
                    style={{...bBtn(shareCopied?"ghost":"primary"),flex:1,padding:"10px",fontSize:13}}>
                    {shareCopied?"✓ Copied!":"📋 Copy Link"}
                  </button>
                  <button onClick={()=>{const text="I shared "+Object.keys(shareSelected).length+" recipes with you on Smart Kitchen! Use code "+shareResult.shareCode+" or tap: "+shareResult.shareUrl;if(navigator.share){navigator.share({title:"Smart Kitchen Recipes",text});}else{window.open("sms:?body="+encodeURIComponent(text));}}}
                    style={{...bBtn("ghost"),flex:1,padding:"10px",fontSize:13,border:"1px solid #22c55e",color:"#22c55e"}}>
                    📱 Text Link
                  </button>
                </div>
                <button onClick={()=>{const body="Hey! I shared some recipes with you on Smart Kitchen. Use code "+shareResult.shareCode+" or tap this link: "+shareResult.shareUrl;window.location.href="mailto:?subject=Smart Kitchen Recipes&body="+encodeURIComponent(body);}}
                  style={{...bBtn("ghost"),width:"100%",padding:"10px",fontSize:13,marginBottom:12}}>
                  ✉ Email Link
                </button>

                <button onClick={()=>{setShowShareModal(false);setShareResult(null);setShareSelected({});setShareMode(false);setShareTitle("");}}
                  style={{...bBtn("ghost"),width:"100%",padding:"9px",fontSize:12}}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- Import Recipe Modal -- */}
      {showImportModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:700,padding:16}} onClick={()=>{if(!importLoading){setShowImportModal(false);setImportResult(null);setImportCode("");}}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:24,maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:FD,fontSize:20,color:"#8b5cf6"}}>📥 Import Recipes</div>
              <button onClick={()=>{setShowImportModal(false);setImportResult(null);setImportCode("");}}
                style={{background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,cursor:"pointer",fontSize:15,padding:"3px 9px"}}>x</button>
            </div>

            {!importResult?(
              <div>
                <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.5}}>
                  Got a recipe share code from a friend or family member? Enter it below to preview and import their recipes.
                </div>
                <input
                  placeholder="Enter share code (e.g. BKQX-7M3P)"
                  value={importCode}
                  onChange={e=>setImportCode(e.target.value.toUpperCase())}
                  onKeyDown={e=>e.key==="Enter"&&importSharedRecipes()}
                  style={{width:"100%",background:C.surface,border:"2px solid #8b5cf6",borderRadius:8,
                    padding:"12px 14px",color:C.text,fontFamily:FD,fontSize:seniorMode?18:15,
                    boxSizing:"border-box",marginBottom:12,letterSpacing:2,textAlign:"center",outline:"none"}}/>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setShowImportModal(false);setImportCode("");}} style={{...bBtn("ghost"),flex:1,padding:"10px"}}>Cancel</button>
                  <button onClick={importSharedRecipes} disabled={importLoading||importCode.replace(/[^A-Z0-9]/g,"").length<6}
                    style={{...bBtn("primary"),flex:2,padding:"10px",fontSize:14,
                      background:"#8b5cf6",opacity:importLoading?0.7:1}}>
                    {importLoading?"Looking up...":"Find Recipes"}
                  </button>
                </div>
              </div>
            ):(
              <div>
                <div style={{background:C.surface,borderRadius:12,padding:14,marginBottom:14}}>
                  <div style={{fontFamily:FD,fontSize:17,color:"#8b5cf6",marginBottom:4}}>{importResult.title}</div>
                  <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:10}}>
                    Shared by {importResult.ownerName} · {importResult.recipeCount} recipe{(importResult.recipeCount||0)>1?"s":""}
                  </div>
                  <div style={{maxHeight:200,overflowY:"auto"}}>
                    {(importResult.recipes||[]).map((r,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",
                        borderBottom:"1px solid "+C.border}}>
                        <span style={{fontSize:14}}>{r.isFamilyRecipe?"📖":"⭐"}</span>
                        <div>
                          <div style={{fontFamily:FM,fontSize:13,color:C.text,fontWeight:600}}>{r.name}</div>
                          {r.time&&<div style={{fontFamily:FM,fontSize:11,color:C.muted}}>{r.time}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginBottom:14,lineHeight:1.5}}>
                  These will be added to your Saved Recipes. You can remove them anytime.
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setImportResult(null)} style={{...bBtn("ghost"),flex:1,padding:"10px"}}>Back</button>
                  <button onClick={()=>confirmImport(importResult.recipes)}
                    style={{...bBtn("primary"),flex:2,padding:"10px",fontSize:14,background:"#8b5cf6"}}>
                    Add All to My Kitchen ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- Bluetooth Scale Modal (Medical+) -- */}
      {showScaleModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:650,padding:16}} onClick={()=>{setShowScaleModal(false);disconnectScale();}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:24,maxWidth:400,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:FD,fontSize:20,color:plateSession?"#10b981":"#3b82f6"}}>{plateSession?"🍽 Build My Plate":"⚖ Portion Scale"}</div>{plateSession&&(<button onClick={()=>{setPlateSession(null);setPlateComponents([]);setPlateStep(0);setPlateCumulativeG(0);setShowPlateSummary(false);setScaleFoodName("");setPlateSuggestedComponents([]);setPlateCurrentComponentIdx(-1);setPlateCoachNote("");setShowScaleModal(false);}} style={{background:"transparent",border:"1px solid #888",borderRadius:8,padding:"6px 14px",color:"#888",fontFamily:FM,fontSize:seniorMode?16:12,fontWeight:600,cursor:"pointer"}}>✕ Exit Plate</button>)}{plateSession&&!showPlateSummary&&(<div style={{marginTop:12}}><div style={{background:"#10b98118",borderRadius:10,padding:"10px 14px",marginBottom:12,border:"1px solid #10b98144"}}><div style={{fontFamily:FM,fontSize:11,color:"#10b981",fontWeight:700}}>{plateSession.memberName} — {plateSession.mealName}</div><div style={{fontFamily:FM,fontSize:10,color:"#888",marginTop:2}}>Step {plateStep+1} of {Math.max(plateStep+1,3)} — {plateStep===0?"Step 1: Zero the plate":plateStep===1?"Step 2: Add protein, tap Log":"Step "+(plateStep+1)+": Tare → Add component → Log"}</div></div>{plateSession&&plateQualifyingMembers.length>1&&!plateSession.activeProfile&&(<div style={{marginBottom:14}}><div style={{fontFamily:FM,fontSize:seniorMode?16:13,color:"#fff",textAlign:"center",marginBottom:12,fontWeight:600}}>Who is this plate for?</div><div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{plateQualifyingMembers.map(p=>(<button key={p.id||p.name} onClick={()=>{setPlateSession(s=>({...s,memberName:p.name||"",activeProfile:p}));setPlatePendingMeal(null);setPlateQualifyingMembers([]);}} style={{background:"#10b98122",border:"2px solid #10b981",borderRadius:24,padding:seniorMode?"14px 22px":"10px 18px",color:"#10b981",fontFamily:FM,fontSize:seniorMode?18:14,fontWeight:700,cursor:"pointer"}}>{p.name||"Member"}{p.medicalPlan?(" — "+p.medicalPlan):(p.guidedPlateMode?" — Guided":"")}</button>))}</div><div style={{fontFamily:FM,fontSize:10,color:"#888",textAlign:"center",marginTop:10}}>Portion targets and coaching will be personalized to this member</div></div>)}<button onClick={()=>{if(scaleDevice?._writeChr){scaleDevice._writeChr.writeValue(new Uint8Array([0x52])).catch(()=>{});}setScaleWeight(0);if(plateStep===0)setPlateStep(1);}} style={{width:"100%",background:"#1a2a3a",border:"2px solid #3b82f6",borderRadius:10,padding:seniorMode?"14px":"10px",color:"#3b82f6",fontFamily:FM,fontSize:seniorMode?18:14,fontWeight:700,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>⚖ Tare / Zero Scale{plateStep===0?" — tap after placing empty plate":plateStep===1?" — tap before adding each item":""}</button><div style={{fontFamily:FM,fontSize:seniorMode?16:13,color:"#ccc",marginBottom:12,lineHeight:1.5,textAlign:"center"}}>{plateStep===0&&"Place your empty plate or bowl on the scale, then tap Tare / Zero above."}{plateStep===1&&"Add your protein. The scale shows live weight. Tap Log Component when ready."}{plateStep>=2&&("Component #"+plateStep+" logged ✓ Tap Tare / Zero above, then add your next item. Weight difference is calculated automatically.")}</div>{(!plateSession||plateSession.activeProfile)&&plateStep>0&&(<div style={{marginBottom:10}}>{plateComponentsLoading&&<div style={{fontFamily:FM,fontSize:11,color:"#888",textAlign:"center",marginBottom:8}}>⏳ Loading meal components...</div>}{!plateComponentsLoading&&plateSuggestedComponents.length>0&&(<div style={{marginBottom:8}}><div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:6,display:"flex",justifyContent:"space-between"}}><span>{plateSuggestedComponents[0]?.fromHistory?"🔄 From your last plate":"Suggested components"}</span><span style={{color:"#3b82f6",cursor:"pointer"}} onClick={()=>setPlateSuggestedComponents([])}>Edit list</span></div><div style={{display:"flex",flexDirection:"column",gap:4}}>{plateSuggestedComponents.map((comp,ci)=>{const isCurrent=ci===plateCurrentComponentIdx;const isDone=plateComponents.some(p=>p.name.toLowerCase()===comp.name.toLowerCase());return(<div key={ci} style={{display:"flex",gap:6,alignItems:"center"}}><button onClick={()=>{if(!isDone){setScaleFoodName(comp.name);setPlateCurrentComponentIdx(ci);setScaleCalcResult(null);setScaleError("");}}} style={{flex:1,textAlign:"left",background:isDone?"#22c55e18":isCurrent?"#3b82f622":"transparent",border:"1px solid "+(isDone?"#22c55e44":isCurrent?"#3b82f6":"#333"),borderRadius:8,padding:"8px 12px",color:isDone?"#22c55e":isCurrent?"#fff":"#888",fontFamily:FM,fontSize:13,cursor:isDone?"default":"pointer",display:"flex",alignItems:"center",gap:8}}>{isDone?"✓":"✧"} {comp.name}<span style={{fontSize:10,color:isDone?"#22c55e44":isCurrent?"#3b82f688":"#555",marginLeft:"auto"}}>{comp.category}</span></button></div>);})}</div><div style={{fontFamily:FM,fontSize:10,color:"#555",marginTop:4}}>Tap a component to select it, or type below to override</div></div>)}<div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:4}}>{plateSuggestedComponents.length>0?"CONFIRM OR EDIT COMPONENT NAME:":"WHAT ARE YOU ADDING?"}</div><input value={scaleFoodName} onChange={e=>setScaleFoodName(e.target.value)} placeholder={plateStep===1?"e.g. Chicken Breast":"e.g. Brown Rice, Green Beans..."} style={{width:"100%",background:"#1a1a2e",border:"1px solid #3b82f6",borderRadius:8,padding:"10px 12px",color:"#fff",fontFamily:"monospace",fontSize:14,boxSizing:"border-box"}}/></div>)}{scaleDevice&&plateStep>0&&(<div style={{textAlign:"center",marginBottom:10}}><div style={{fontFamily:"serif",fontSize:42,color:"#10b981"}}>{scaleWeight?.toFixed(scaleUnit==="lb"?3:1)||"0.0"}</div><div style={{fontFamily:FM,fontSize:12,color:"#888"}}>{scaleUnit}</div>{plateStep>1&&plateCumulativeG>0&&(<div style={{fontFamily:FM,fontSize:11,color:"#f59e0b",marginTop:4}}>This component: ~{Math.max(0,(scaleWeightGrams-plateCumulativeG)).toFixed(0)}g</div>)}</div>)}{plateStep>0&&scaleDevice&&scaleFoodName.trim()&&(<button onClick={async()=>{const componentG=plateStep===1?scaleWeightGrams:Math.max(0,scaleWeightGrams-plateCumulativeG);if(componentG<1) return;setScaleCalcLoading(true);try{const raw=await callClaude({system:"Nutrition AI. Return ONLY valid JSON: {calories,protein_g,carbs_g,fat_g,sat_fat_g,sugar_g,fiber_g,sodium_mg}. Numbers only, no units.",prompt:"Estimate nutrition for "+componentG.toFixed(0)+"g of "+scaleFoodName.trim()+". Return JSON only.",maxTokens:200,});const text=typeof raw==="string"?raw:raw?.content?.[0]?.text||"";const clean=text.replace(/```json|```/g,"").trim();const s=clean.indexOf("{");const e=clean.lastIndexOf("}");if(s===-1||e===-1) throw new Error("no json");const parsed=JSON.parse(clean.slice(s,e+1));const activeP=plateSession.activeProfile;const wwBudget=activeP?.wwPointsBudget;const wwPts=wwBudget?Math.max(0,Math.round(((parsed.calories||0)*0.0305)+((parsed.sat_fat_g||0)*0.275)+((parsed.sugar_g||0)*0.12)-((parsed.protein_g||0)*0.098))):null;const newComp={name:scaleFoodName.trim(),weightG:componentG,calories:parsed.calories||0,protein_g:parsed.protein_g||0,carbs_g:parsed.carbs_g||0,sat_fat_g:parsed.sat_fat_g||0,sugar_g:parsed.sugar_g||0,fiber_g:parsed.fiber_g||0,sodium_mg:parsed.sodium_mg||0,wwPoints:wwPts};const updated=[...plateComponents,newComp];setPlateComponents(updated);setPlateCumulativeG(scaleWeightGrams);setPlateStep(s=>s+1);setPlateCurrentComponentIdx(-1);setScaleFoodName("");setScaleCalcResult(null);logNutrition({memberName:activeP?.name||null,itemName:newComp.name,weightG:componentG,calories:newComp.calories,protein_g:newComp.protein_g,carbs_g:newComp.carbs_g,fat_g:parsed.fat_g||0,sat_fat_g:newComp.sat_fat_g,sugar_g:newComp.sugar_g,fiber_g:newComp.fiber_g,sodium_mg:newComp.sodium_mg,wwPoints:wwPts,source:"smart_plate",sessionId:plateSessionId});}catch(err){setScaleError("Could not estimate — try again.");}// Auto-tare AFTER try/catch so .catch() inside setTimeout does not confuse parser
setScaleCalcLoading(false);setTimeout(()=>{if(scaleDevice&&scaleDevice._writeChr){const cmd=new Uint8Array([0x52]);scaleDevice._writeChr.writeValue(cmd).then(()=>{}).then(()=>{});}setScaleWeight(0);},400);}} style={{width:"100%",background:"#10b981",border:"none",borderRadius:10,padding:seniorMode?"14px":"10px",color:"#fff",fontFamily:FM,fontSize:seniorMode?18:14,fontWeight:700,cursor:"pointer",marginBottom:8}}>{scaleCalcLoading?"⏳ Calculating...":"✓ Log Component"}</button>)}{plateComponents.length>0&&(<div style={{marginBottom:10}}><div style={{fontFamily:FM,fontSize:10,color:"#888",marginBottom:6}}>LOGGED SO FAR</div>{plateComponents.map((comp,ci)=>(<div key={ci} style={{display:"flex",justifyContent:"space-between",fontFamily:FM,fontSize:11,color:"#aaa",marginBottom:3,padding:"4px 8px",background:"#ffffff08",borderRadius:6}}><span>{comp.name}</span><span style={{color:"#10b981"}}>{comp.weightG.toFixed(0)}g • {comp.protein_g.toFixed(0)}g pro • {comp.calories.toFixed(0)}cal</span></div>))}</div>)}{plateComponents.length>0&&(<button onClick={async()=>{setShowPlateSummary(true);setPlateCoachLoading(true);const activeP=plateSession.activeProfile;const totP=plateComponents.reduce((a,r)=>a+(r.protein_g||0),0).toFixed(0);const totCal=plateComponents.reduce((a,r)=>a+(r.calories||0),0).toFixed(0);const totCarb=plateComponents.reduce((a,r)=>a+(r.carbs_g||0),0).toFixed(0);const totSat=plateComponents.reduce((a,r)=>a+(r.sat_fat_g||0),0).toFixed(0);const plan=activeP?.medicalPlan||"";const phase=activeP?.bariatricPhase||"";const ptarget=activeP?.proteinTargetG||75;const prompt="Member: "+(activeP?.name||"person")+". Dietary plan: "+(plan||"general")+". "+(phase?"Bariatric phase: "+phase+". ":"")+("Protein target: "+ptarget+"g/day. ")+"This plate: "+plateComponents.map(c=>c.name+" "+c.weightG.toFixed(0)+"g ("+c.protein_g.toFixed(0)+"g protein, "+c.calories.toFixed(0)+" cal, "+c.carbs_g.toFixed(0)+"g carbs)").join("; ")+". Total: "+totP+"g protein, "+totCal+" cal, "+totCarb+"g carbs, "+totSat+"g sat fat. Write 2-3 sentences of coaching feedback for this plate. Be specific, warm, and practical. No medical advice disclaimer needed in the coaching note.";try{const note=await callClaude({system:"You are a friendly nutrition coach for a meal planning app. Give brief, warm, specific feedback on the plate the user just built. 2-3 sentences max. Plain language, no jargon.",prompt,maxTokens:150});setPlateCoachNote(typeof note==="string"?note:note?.content?.[0]?.text||"");}catch{setPlateCoachNote("");}setPlateCoachLoading(false);}} style={{width:"100%",background:"#1a1a2e",border:"1px solid #10b981",borderRadius:10,padding:seniorMode?"12px":"8px",color:"#10b981",fontFamily:FM,fontSize:seniorMode?16:13,fontWeight:700,cursor:"pointer"}}>🍽 Done — See Plate Summary</button>)}<button onClick={()=>{setPlateSession(null);setPlateComponents([]);setPlateStep(0);setPlateCumulativeG(0);setShowPlateSummary(false);setScaleFoodName("");}} style={{width:"100%",background:"transparent",border:"none",color:"#888",fontFamily:FM,fontSize:11,cursor:"pointer",marginTop:6,padding:4}}>Cancel — switch to quick weigh</button></div>)}{plateSession&&showPlateSummary&&(<div style={{marginTop:12}}><div style={{fontFamily:FD,fontSize:16,color:"#10b981",marginBottom:10,textAlign:"center"}}>🍽 {plateSession.mealName} — Plate Summary</div>{plateComponents.map((comp,ci)=>(<div key={ci} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:4,padding:"6px 10px",background:"#ffffff08",borderRadius:8,marginBottom:4}}><div style={{fontFamily:FM,fontSize:12,color:"#fff",fontWeight:600}}>{comp.name}</div><div style={{fontFamily:FM,fontSize:11,color:"#10b981",textAlign:"right"}}>{comp.weightG.toFixed(0)}g</div><div style={{fontFamily:FM,fontSize:11,color:"#888",gridColumn:"1/-1"}}>{comp.protein_g.toFixed(0)}g protein • {comp.calories.toFixed(0)} cal • {comp.carbs_g.toFixed(0)}g carbs • {comp.sat_fat_g.toFixed(1)}g sat fat{comp.wwPoints!=null?" • "+comp.wwPoints+"pts":""}</div></div>))}<div style={{borderTop:"1px solid #10b98144",marginTop:8,paddingTop:8}}><div style={{display:"grid",gridTemplateColumns:"1fr auto",fontFamily:FM,fontSize:13,fontWeight:700,color:"#10b981",marginBottom:4}}><span>PLATE TOTAL</span><span>{plateComponents.reduce((a,r)=>a+(r.weightG||0),0).toFixed(0)}g</span></div><div style={{fontFamily:FM,fontSize:12,color:"#aaa"}}>{plateComponents.reduce((a,r)=>a+(r.protein_g||0),0).toFixed(0)}g protein • {plateComponents.reduce((a,r)=>a+(r.calories||0),0).toFixed(0)} cal • {plateComponents.reduce((a,r)=>a+(r.carbs_g||0),0).toFixed(0)}g carbs{plateSession.activeProfile?.wwPointsBudget?(" • "+plateComponents.reduce((a,r)=>a+(r.wwPoints||0),0)+" pts total"):""}</div></div>{plateCoachLoading&&<div style={{fontFamily:FM,fontSize:12,color:"#888",textAlign:"center",marginTop:10}}>⏳ Getting coaching feedback...</div>}{plateCoachNote&&!plateCoachLoading&&(<div style={{background:"#10b98118",border:"1px solid #10b98144",borderRadius:10,padding:"10px 14px",marginTop:10}}><div style={{fontFamily:FM,fontSize:11,color:"#10b981",fontWeight:700,marginBottom:4}}>Coaching Note</div><div style={{fontFamily:FM,fontSize:12,color:"#ccc",lineHeight:1.6}}>{plateCoachNote}</div></div>)}<div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}><button onClick={()=>{if(plateSession?.mealName&&plateComponents.length>0) savePlateHistory(plateSession.mealName,plateComponents);setPlateSession(null);setPlateComponents([]);setPlateStep(0);setPlateCumulativeG(0);setShowPlateSummary(false);setScaleFoodName("");setPlateSuggestedComponents([]);setPlateCurrentComponentIdx(0);setShowScaleModal(false);}} style={{width:"100%",background:"#10b981",border:"none",borderRadius:10,padding:seniorMode?"16px":"12px",color:"#fff",fontFamily:FM,fontSize:seniorMode?20:15,fontWeight:700,cursor:"pointer"}}>✅ Save & Close</button><button onClick={()=>{setShowPlateSummary(false);setPlateStep(1);setScaleFoodName("");}} style={{width:"100%",background:"transparent",border:"1px solid #10b981",borderRadius:10,padding:seniorMode?"12px":"8px",color:"#10b981",fontFamily:FM,fontSize:seniorMode?16:12,fontWeight:600,cursor:"pointer"}}>🍽 Add another component to this plate</button><button onClick={()=>{setPlateSession(null);setPlateComponents([]);setPlateStep(0);setPlateCumulativeG(0);setShowPlateSummary(false);setScaleFoodName("");}} style={{width:"100%",background:"transparent",border:"none",color:"#888",fontFamily:FM,fontSize:11,cursor:"pointer",padding:4}}>Build a plate for someone else</button></div></div>)}
              <button onClick={()=>{setPlateSession(null);setPlateComponents([]);setPlateStep(0);setPlateCumulativeG(0);setShowPlateSummary(false);setScaleFoodName("");setPlateSuggestedComponents([]);setPlateCurrentComponentIdx(-1);setPlateCoachNote("");setShowScaleModal(false);disconnectScale();}} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,cursor:"pointer",fontSize:15,padding:"3px 9px"}}>x</button>
            </div>

            {/* Browser check */}
            {!navigator.bluetooth&&(
              <div style={{background:"#dc262612",border:"1px solid #dc262644",borderRadius:10,padding:12,marginBottom:16}}>
                <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:"#dc2626",marginBottom:4}}>Browser Not Supported</div>
                <div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.5}}>Web Bluetooth requires Chrome or Edge on Android, Windows, or Mac. It does not work on iOS Safari or Firefox.</div>
              </div>
            )}

            {/* Connect / Status */}
            {!scaleDevice?(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:48,marginBottom:12}}>⚖</div>
                <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.5}}>
                  Connect your Bluetooth kitchen scale to weigh portions and get instant calorie estimates.
                </div>
                <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginBottom:16}}>
                  Compatible: <strong style={{color:C.text}}>Etekcity Nutrition Scale</strong> (ENS-L221S) · Service 0xFFF0
                </div>
                <button onClick={connectScale} disabled={scaleConnecting||!navigator.bluetooth}
                  style={{...bBtn("primary"),padding:"12px 24px",fontSize:14,opacity:(!navigator.bluetooth)?0.5:1}}>
                  {scaleConnecting?"Searching...":"Connect Scale"}
                </button>
                {scaleError&&<div style={{fontFamily:FM,fontSize:11,color:"#dc2626",marginTop:12,lineHeight:1.5}}>{scaleError}</div>}
                <div style={{fontFamily:FM,fontSize:10,color:C.muted,marginTop:12}}>Make sure your scale is powered on and nearby.</div>
              </div>
            ):(
              <div>
                {/* Live weight display */}
                <div style={{background:C.surface,borderRadius:14,padding:20,textAlign:"center",marginBottom:16,border:"2px solid #3b82f644"}}>
                  <div style={{fontFamily:FM,fontSize:11,color:"#3b82f6",fontWeight:600,marginBottom:4}}>CONNECTED · LIVE READING</div>
                  <div style={{fontFamily:FD,fontSize:seniorMode?52:42,color:C.text,lineHeight:1}}>
                    {scaleWeight!==null?scaleWeight.toFixed(1):"---"}
                  </div>
                  <div style={{fontFamily:FM,fontSize:16,color:C.muted}}>{scaleUnit}</div>
                  {scaleWeight>0&&<div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:4}}>{scaleUnit==="g"?((scaleWeight/28.35).toFixed(2)+" oz · "+(scaleWeight/453.6).toFixed(3)+" lb"):scaleUnit==="oz"?((scaleWeight).toFixed(2)+" oz · "+scaleWeightGrams.toFixed(1)+" g"):scaleUnit==="lb"?((scaleWeight).toFixed(3)+" lb · "+scaleWeightGrams.toFixed(1)+" g"):scaleUnit==="ml"?((scaleWeight).toFixed(1)+" ml · "+(scaleWeight/29.5735).toFixed(2)+" fl.oz"):scaleUnit==="fl.oz"?((scaleWeight).toFixed(2)+" fl.oz · "+(scaleWeight*29.5735).toFixed(1)+" ml"):""}</div>}
                </div>

                {/* Food name input */}
                <div style={{marginBottom:12}}>
                  <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>What are you weighing?</div>
                  <input placeholder='e.g. "Chicken breast" or "Brown rice cooked"'
                    value={scaleFoodName}
                    onChange={e=>setScaleFoodName(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&calcScaleNutrition()}
                    style={{...bInp,fontSize:13}}/>
                </div>

                {/* Estimate button */}
                <button onClick={calcScaleNutrition}
                  disabled={!scaleFoodName.trim()||!scaleWeight||scaleCalcLoading}
                  style={{...bBtn("primary"),width:"100%",padding:"11px",fontSize:13,marginBottom:12,
                  opacity:(!scaleFoodName.trim()||!scaleWeight)?0.5:1}}>
                  {scaleCalcLoading?"Calculating...":"Estimate Nutrition"}
                </button>

                {/* Nutrition result */}
                {scaleCalcResult&&(
                  <div style={{background:C.surface,borderRadius:12,padding:16,marginBottom:12}}>
                    <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:C.text,marginBottom:10}}>
                      {scaleFoodName} · {scaleWeight?.toFixed(scaleUnit==="lb"?3:1)}{scaleUnit}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["Calories","cal",scaleCalcResult.calories,"#f59e0b"],["Protein","g",scaleCalcResult.protein_g,"#3b82f6"],["Carbs","g",scaleCalcResult.carbs_g,"#22c55e"],["Fat","g",scaleCalcResult.fat_g,"#ef4444"],["Sat. Fat","g",scaleCalcResult.sat_fat_g,"#dc2626"],["Sugar","g",scaleCalcResult.sugar_g,"#f97316"],["Fiber","g",scaleCalcResult.fiber_g,"#8b5cf6"],["Sodium","mg",scaleCalcResult.sodium_mg,"#64748b"]].map(([label,unit,val,color])=>(<div key={label} style={{background:C.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+C.border}}><div style={{fontFamily:FM,fontSize:10,color:C.muted,marginBottom:2}}>{label}</div><div style={{fontFamily:FD,fontSize:seniorMode?20:16,color:color}}>{val??"-"}<span style={{fontSize:10,color:C.muted}}> {unit}</span></div></div>))}</div>{(()=>{const activeP=familyProfiles.find(p=>p.guidedPlateMode)||familyProfiles[0];const ptarget=activeP?.proteinTargetG;const pval=scaleCalcResult.protein_g;if(!ptarget||!pval) return null;const pct=Math.round((pval/ptarget)*100);const met=pval>=ptarget*0.9;return(<div style={{marginTop:10,background:met?"#1b5e2018":"#f59e0b18",borderRadius:8,padding:"8px 12px",border:"1px solid "+(met?"#22c55e":"#f59e0b")}}><div style={{fontFamily:FM,fontSize:11,color:met?"#22c55e":"#f59e0b",fontWeight:700}}>{pval}g protein — {pct}% of {ptarget}g daily target{met?" ✓":""}</div></div>);})()}{(()=>{const activeP=familyProfiles.find(p=>p.wwPointsBudget)||familyProfiles[0];const budget=activeP?.wwPointsBudget;if(!budget||!scaleCalcResult.calories) return null;const cal=scaleCalcResult.calories||0;const sat=scaleCalcResult.sat_fat_g||0;const sug=scaleCalcResult.sugar_g||0;const pro=scaleCalcResult.protein_g||0;const pts=Math.max(0,Math.round((cal*0.0305)+(sat*0.275)+(sug*0.12)-(pro*0.098)));const rem=Math.max(0,budget-pts);return(<div style={{marginTop:8,background:"#7c3aed18",borderRadius:8,padding:"8px 12px",border:"1px solid #7c3aed"}}><div style={{fontFamily:FM,fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:2}}>WW Points Estimate: {pts} pts</div><div style={{fontFamily:FM,fontSize:10,color:C.muted}}>{rem} pts remaining of {budget} daily budget • estimate only, not official WW value</div></div>);})()}{scaleCalcResult.notes&&<div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:8,lineHeight:1.5}}>{scaleCalcResult.notes}</div>}
                  </div>
                )}

                {scaleError&&<div style={{fontFamily:FM,fontSize:11,color:"#dc2626",marginBottom:8}}>{scaleError}</div>}

                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <button onClick={()=>{
                    // Send tare command on FFF2
                    if(scaleDevice?._writeChr){
                      scaleDevice._writeChr.writeValue(new Uint8Array([0x52])).catch(()=>{});
                    }
                    setScaleWeight(0);
                  }} style={{...bBtn("ghost"),flex:1,padding:"9px",fontSize:12,
                    border:"1px solid "+C.border}}>
                    ⚖ Tare / Zero
                  </button>
                  <button onClick={disconnectScale} style={{...bBtn("ghost"),flex:1,padding:"9px",
                    fontSize:12,color:"#dc2626",border:"1px solid #dc262644"}}>
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* Setup instructions */}
            <div style={{background:C.surface,borderRadius:10,padding:12,marginTop:14}}>
              <div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:C.text,marginBottom:4}}>Recommended Scale</div>
              <div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.5}}>
                <strong style={{color:C.text}}>Etekcity Nutrition Scale</strong> — confirmed compatible (BLE FFF0/FFF1/FFF2).<br/>
                Search “Etekcity Nutrition Scale ENS-L221S” on Amazon.
              </div>
            </div>

          </div>
        </div>
      )}


      {/* -- Recipe Share / Import Modal -- */}
      {showShareModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:650,padding:16}} onClick={()=>{setShowShareModal(false);setShareResult(null);}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:24,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent}}>📤 Recipe Sharing</div>
              <button onClick={()=>{setShowShareModal(false);setShareResult(null);}} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,cursor:"pointer",fontSize:15,padding:"3px 9px"}}>x</button>
            </div>

            {/* SUCCESS STATE */}
            {shareResult&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:12}}>🎉</div>
                <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:8}}>Your recipes are ready to share!</div>
                <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.5}}>
                  Share this code with anyone. They can enter it in Smart Kitchen to import your recipes into their account.
                </div>
                <div style={{background:C.surface,borderRadius:12,padding:20,marginBottom:16}}>
                  <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginBottom:6}}>SHARE CODE</div>
                  <div style={{fontFamily:FD,fontSize:42,color:C.accent,letterSpacing:6,marginBottom:10}}>{shareResult.code}</div>
                  <div style={{fontFamily:FM,fontSize:11,color:C.muted}}>Valid for 90 days · {Object.keys(shareSelected).length||"Selected"} recipes</div>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  <button onClick={()=>{navigator.clipboard?.writeText(shareResult.code);alert("Code copied!");}}
                    style={{...bBtn("ghost"),flex:1,padding:"10px",fontSize:13}}>📋 Copy Code</button>
                  <button onClick={()=>{navigator.clipboard?.writeText(shareResult.url);alert("Link copied!");}}
                    style={{...bBtn("primary"),flex:2,padding:"10px",fontSize:13}}>🔗 Copy Link</button>
                </div>
                {navigator.share&&<button onClick={()=>navigator.share({title:"Smart Kitchen Recipes",text:"Here are my recipes! Use code "+shareResult.code+" in Smart Kitchen to import them.",url:shareResult.url})}
                  style={{...bBtn("ghost"),width:"100%",padding:"10px",fontSize:13,marginBottom:8}}>📱 Share via Messages / Email</button>}
                <button onClick={()=>setShareResult(null)} style={{...bBtn("ghost"),width:"100%",padding:"9px",fontSize:12,color:C.muted}}>Share More Recipes</button>
              </div>
            )}

            {/* TABS: SHARE vs IMPORT */}
            {!shareResult&&(
              <div>
                <div style={{display:"flex",gap:6,marginBottom:20}}>
                  {[["share","📤 Share My Recipes"],["import","📥 Import Recipes"]].map(([k,label])=>(
                    <button key={k} onClick={()=>{setShareSelectMode(k==="share");if(k==="import"){setShareSelected([]);}}}
                      style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+(shareMode&&k==="share"||!shareMode&&k==="import"?C.accent:C.border),
                      background:(shareMode&&k==="share"||!shareMode&&k==="import")?C.accent+"22":"transparent",
                      color:(shareMode&&k==="share"||!shareMode&&k==="import")?C.accent:C.text,
                      fontFamily:FM,fontSize:seniorMode?15:12,cursor:"pointer",fontWeight:600}}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* SHARE TAB */}
                {shareMode&&(
                  <div>
                    <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.5}}>
                      Select recipes to share. Recipients get a 6-character code to import them into their Smart Kitchen.
                    </div>
                    <div style={{marginBottom:10}}>
                      <input placeholder='Give this collection a name (e.g. "Rick’s Favorites")'
                        value={shareTitle} onChange={e=>setShareTitle(e.target.value)}
                        style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:8,
                        padding:"8px 10px",color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box"}}/>
                    </div>

                    {/* 5-Star Saved Recipes */}
                    {Object.entries(recipeRatings).filter(([,v])=>v?.rating>=3).length>0&&(
                      <div style={{marginBottom:12}}>
                        <div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:C.muted,marginBottom:6}}>⭐ SAVED RECIPES (3+ stars)</div>
                        {Object.entries(recipeRatings).filter(([,v])=>v?.rating>=3).map(([name,v])=>(
                          <div key={name} onClick={()=>setShareSelected(p=>{const n={...p};if(n[name])delete n[name];else n[name]={name,isFamilyRecipe:false};return n;})}
                            style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,
                            background:name in shareSelected?C.accent+"18":"transparent",
                            border:"1px solid "+(name in shareSelected?C.accent:C.border),
                            marginBottom:4,cursor:"pointer"}}>
                            <div style={{width:20,height:20,borderRadius:4,border:"2px solid "+(name in shareSelected?C.accent:C.border),
                              background:name in shareSelected?C.accent:"transparent",display:"flex",alignItems:"center",
                              justifyContent:"center",fontSize:12,flexShrink:0}}>
                              {name in shareSelected&&"✓"}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontFamily:FM,fontSize:13,color:C.text,fontWeight:600}}>{name}</div>
                              <div style={{fontFamily:FM,fontSize:11,color:C.muted}}>{"★".repeat(v.rating)}{"☆".repeat(5-v.rating)} · Saved</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Family Recipes */}
                    {familyRecipes.length>0&&(
                      <div style={{marginBottom:16}}>
                        <div style={{fontFamily:FM,fontSize:11,fontWeight:700,color:C.muted,marginBottom:6}}>📖 FAMILY RECIPES</div>
                        {familyRecipes.map(r=>(
                          <div key={r.id} onClick={()=>setShareSelected(p=>{const n={...p};if(n[r.name])delete n[r.name];else n[r.name]={...r,isFamilyRecipe:true};return n;})}
                            style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,
                            background:r.name in shareSelected?C.accent+"18":"transparent",
                            border:"1px solid "+(r.name in shareSelected?C.accent:C.border),
                            marginBottom:4,cursor:"pointer"}}>
                            <div style={{width:20,height:20,borderRadius:4,border:"2px solid "+(r.name in shareSelected?C.accent:C.border),
                              background:r.name in shareSelected?C.accent:"transparent",display:"flex",alignItems:"center",
                              justifyContent:"center",fontSize:12,flexShrink:0}}>
                              {r.name in shareSelected&&"✓"}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontFamily:FM,fontSize:13,color:C.text,fontWeight:600}}>{r.name}</div>
                              <div style={{fontFamily:FM,fontSize:11,color:C.muted}}>📖 Family Recipe{r.notes?" · "+r.notes.slice(0,30):""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(shareSelected).length>0&&(
                      <div style={{background:C.accent+"12",borderRadius:8,padding:"8px 12px",marginBottom:12,fontFamily:FM,fontSize:12,color:C.accent}}>
                        {Object.keys(shareSelected).length} recipe{Object.keys(shareSelected).length!==1?"s":""} selected
                      </div>
                    )}

                    <button onClick={shareRecipes} disabled={!Object.keys(shareSelected).length||shareLoading}
                      style={{...bBtn("primary"),width:"100%",padding:"12px",fontSize:14,
                      opacity:Object.keys(shareSelected).length?1:0.4}}>
                      {shareLoading?"Creating share link...":"Create Share Link — "+Object.keys(shareSelected).length+" Recipe"+(Object.keys(shareSelected).length!==1?"s":"")}
                    </button>
                  </div>
                )}

                {/* IMPORT TAB */}
                {!shareMode&&(
                  <div>
                    <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.5}}>
                      Enter a 6-character share code from a friend or family member to import their recipes into your Smart Kitchen.
                    </div>
                    <div style={{marginBottom:12}}>
                      <input placeholder="Enter share code (e.g. ABC123)"
                        value={importCode}
                        onChange={e=>setImportCode(e.target.value.toUpperCase().slice(0,6))}
                        onKeyDown={e=>e.key==="Enter"&&importSharedRecipes()}
                        style={{width:"100%",background:C.surface,border:"2px solid "+C.accent,borderRadius:10,
                        padding:"12px 14px",color:C.text,fontFamily:FD,fontSize:seniorMode?22:18,
                        boxSizing:"border-box",letterSpacing:4,textAlign:"center",outline:"none"}}/>
                    </div>
                    <button onClick={importSharedRecipes} disabled={importCode.length<4||importLoading}
                      style={{...bBtn("primary"),width:"100%",padding:"12px",fontSize:14,marginBottom:16,
                      opacity:importCode.length>=4?1:0.4}}>
                      {importLoading?"Looking up recipes...":"Find Recipes"}
                    </button>

                    {importResult&&(
                      <div style={{background:C.surface,borderRadius:12,padding:16,border:"1px solid "+C.border}}>
                        <div style={{fontFamily:FD,fontSize:18,color:C.accent,marginBottom:4}}>{importResult.title}</div>
                        <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:12}}>
                          Shared by {importResult.owner_name} · {importResult.recipe_count} recipe{importResult.recipe_count!==1?"s":""}
                        </div>
                        <div style={{marginBottom:12,maxHeight:200,overflowY:"auto"}}>
                          {(importResult.recipes||[]).map((r,i)=>(
                            <div key={i} style={{fontFamily:FM,fontSize:13,color:C.text,padding:"6px 0",
                              borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",gap:8}}>
                              <span>{r.isFamilyRecipe?"📖":"⭐"}</span>
                              <span style={{flex:1}}>{r.name}</span>
                              {r.rating>0&&<span style={{color:"#f59e0b",fontSize:11}}>{"★".repeat(r.rating)}</span>}
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>{setImportResult(null);setImportCode("");}}
                            style={{...bBtn("ghost"),flex:1,padding:"10px"}}>Cancel</button>
                          <button onClick={()=>addImportedRecipes(importResult.recipes||[])}
                            style={{...bBtn("primary"),flex:2,padding:"10px",fontSize:13}}>
                            Add All to My Smart Kitchen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- Twilio SMS Setup Help Modal -- */}
      {showSmsHelp&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:700,padding:16}} onClick={()=>setShowSmsHelp(false)}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:24,maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:FD,fontSize:20,color:C.text}}>Background SMS Setup</div>
              <button onClick={()=>setShowSmsHelp(false)} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,cursor:"pointer",fontSize:15,padding:"3px 9px"}}>x</button>
            </div>
            <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>
              Twilio lets Smart Kitchen send your shopping list as a real SMS in the background — no app picker, no extra taps. Takes about 5 minutes to set up and costs less than a penny per message.
            </div>

            {/* Step 1 */}
            <div style={{background:C.surface,borderRadius:10,padding:14,marginBottom:10}}>
              <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:C.accent,marginBottom:6}}>Step 1 — Create a free Twilio account</div>
              <div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:8}}>Go to twilio.com and sign up. The free trial gives you $15 credit — enough for hundreds of messages.</div>
              <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noreferrer"
                style={{display:"inline-block",background:C.accent,color:"#0c0e14",fontFamily:FM,fontSize:11,fontWeight:700,padding:"7px 14px",borderRadius:6,textDecoration:"none"}}>
                Open twilio.com
              </a>
            </div>

            {/* Step 2 */}
            <div style={{background:C.surface,borderRadius:10,padding:14,marginBottom:10}}>
              <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:C.accent,marginBottom:6}}>Step 2 — Copy your credentials</div>
              <div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.6}}>
                From your Twilio Console dashboard, copy:<br/>
                <span style={{color:C.text,fontWeight:600}}>Account SID</span> — starts with AC...<br/>
                <span style={{color:C.text,fontWeight:600}}>Auth Token</span> — click the eye icon to reveal<br/>
                Then go to <strong style={{color:C.text}}>Phone Numbers → Buy a Number</strong> — about $1/month (free on trial).
              </div>
            </div>

            {/* Step 3 */}
            <div style={{background:C.surface,borderRadius:10,padding:14,marginBottom:10}}>
              <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:C.accent,marginBottom:6}}>Step 3 — Add to Vercel</div>
              <div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.6}}>
                Go to your <strong style={{color:C.text}}>Vercel dashboard → smart-kitchen → Settings → Environment Variables</strong> and add these three:<br/><br/>
                <code style={{background:C.bg,padding:"2px 6px",borderRadius:4,fontSize:10,display:"block",marginBottom:3}}>TWILIO_ACCOUNT_SID = AC...</code>
                <code style={{background:C.bg,padding:"2px 6px",borderRadius:4,fontSize:10,display:"block",marginBottom:3}}>TWILIO_AUTH_TOKEN = your_token</code>
                <code style={{background:C.bg,padding:"2px 6px",borderRadius:4,fontSize:10,display:"block"}}>TWILIO_PHONE_NUMBER = +16165551234</code>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{background:C.surface,borderRadius:10,padding:14,marginBottom:16}}>
              <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:C.accent,marginBottom:6}}>Step 4 — Redeploy</div>
              <div style={{fontFamily:FM,fontSize:11,color:C.muted,lineHeight:1.6}}>
                In Vercel, click <strong style={{color:C.text}}>Deployments → Redeploy</strong> on the latest deployment. After that, "Text to..." sends silently in the background — no app picker needed.
              </div>
            </div>

            <div style={{fontFamily:FM,fontSize:11,color:C.muted,textAlign:"center",marginBottom:14,lineHeight:1.5}}>
              In the meantime, "Text to..." still works on mobile and opens your messaging app on desktop — your list is always pre-filled and ready.
            </div>

            <button onClick={()=>setShowSmsHelp(false)} style={{...bBtn("primary"),width:"100%",padding:"11px",fontSize:13}}>Got It</button>
          </div>
        </div>
      )}

      {/* -- Occasion Planner Modal -- */}
      {showOccasionPlanner&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:16}} onClick={()=>{if(!occasionLoading){setShowOccasionPlanner(false);setOccasionStep("form");setOccasionResult(null);setOccasionDate("");}}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:24,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontFamily:FD,fontSize:22,color:C.accent}}>
                {occasionStep==="form"&&"Plan an Occasion"}
                {occasionStep==="loading"&&"Planning your meal..."}
                {occasionStep==="result"&&(occasionResult?.meal||"Your Occasion Meal")}
                {occasionStep==="date"&&"When is the occasion?"}
              </div>
              {!occasionLoading&&<button onClick={()=>{setShowOccasionPlanner(false);setOccasionStep("form");setOccasionResult(null);setOccasionDate("");}} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,cursor:"pointer",fontSize:16,padding:"4px 10px",fontWeight:600}}>x</button>}
            </div>

            {/* STEP: FORM */}
            {occasionStep==="form"&&(
              <div>
                <div style={{fontFamily:FM,fontSize:12,color:C.muted,marginBottom:18}}>Tell Smart Kitchen what you are cooking for and it will plan the perfect meal.</div>
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>Name this occasion <span style={{fontWeight:400,color:C.muted}}>(optional)</span></div>
                  <input placeholder='e.g. "Anniversary dinner", "Backyard BBQ", "Kids birthday"'
                    value={occasionCustomText}
                    onChange={e=>setOccasionCustomText(e.target.value)}
                    style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>What is the occasion?</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                  {OCCASION_EVENT_TYPES.map(ev=>(
                    <button key={ev.key} onClick={()=>setOccasionState(s=>({...s,eventType:s.eventType===ev.key?"":ev.key}))}
                      style={{padding:"8px 14px",borderRadius:20,border:"1px solid "+(occasionState.eventType===ev.key?C.accent:C.border),
                      background:occasionState.eventType===ev.key?C.accent+"22":"transparent",
                      color:occasionState.eventType===ev.key?C.accent:C.text,fontFamily:FM,fontSize:seniorMode?15:12,cursor:"pointer",fontWeight:600}}>
                      {ev.emoji} {ev.label}
                      <div style={{fontSize:9,color:C.muted,fontWeight:400,marginTop:1}}>{ev.desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>Who is joining you?</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                  {OCCASION_AUDIENCE_TYPES.map(au=>(
                    <button key={au.key} onClick={()=>setOccasionState(s=>({...s,audienceType:au.key,headCount:au.key==="adult"?"2":s.headCount}))}
                      style={{padding:"8px 14px",borderRadius:20,border:"1px solid "+(occasionState.audienceType===au.key?C.accent:C.border),
                      background:occasionState.audienceType===au.key?C.accent+"22":"transparent",
                      color:occasionState.audienceType===au.key?C.accent:C.text,fontFamily:FM,fontSize:seniorMode?15:12,cursor:"pointer",fontWeight:600}}>
                      {au.emoji} {au.label}
                    </button>
                  ))}
                </div>
                {occasionState.audienceType==="adult"&&(
                  <div style={{background:"#7c3aed"+"15",border:"1px solid "+"#7c3aed"+"44",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>💑</span>
                    <div>
                      <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:"#7c3aed"}}>Intimate Date Night · Adults (21+)</div>
                      <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:2}}>Head count set to 2. Smart Kitchen will suggest an elevated, romantic meal — wine pairings included.</div>
                    </div>
                  </div>
                )}
                {occasionState.audienceType==="adults"&&(
                  <div style={{background:"#d97706"+"15",border:"1px solid "+"#d97706"+"44",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>🍺</span>
                    <div>
                      <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:"#d97706"}}>Adults Party · 21+</div>
                      <div style={{fontFamily:FM,fontSize:11,color:C.muted,marginTop:2}}>Great for BBQs, game days, holiday gatherings. Beer, wine, and cocktail-friendly food — shareable crowd-pleasers.</div>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:120}}>
                    <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>Head count</div>
                    <input type="number" min="1" max="50" placeholder={String(activeProfiles.length||4)}
                      value={occasionState.headCount}
                      onChange={e=>setOccasionState(s=>({...s,headCount:e.target.value}))}
                      style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                  <div style={{flex:2,minWidth:160}}>
                    <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>Mode</div>
                    <div style={{display:"flex",gap:6}}>
                      {[["use","Use What I Have"],["surprise","Surprise Me"]].map(([k,label])=>(
                        <button key={k} onClick={()=>setOccasionState(s=>({...s,mode:k}))}
                          style={{flex:1,padding:"8px 6px",borderRadius:8,border:"1px solid "+(occasionState.mode===k?C.accent:C.border),
                          background:occasionState.mode===k?C.accent+"22":"transparent",color:occasionState.mode===k?C.accent:C.text,
                          fontFamily:FM,fontSize:seniorMode?14:11,cursor:"pointer",fontWeight:600}}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {occasionState.mode==="surprise"&&(
                  <div style={{marginBottom:16}}>
                    <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>Budget</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {OCCASION_BUDGETS.map(b=>(
                        <button key={b} onClick={()=>setOccasionState(s=>({...s,budget:s.budget===b?"":b}))}
                          style={{padding:"6px 12px",borderRadius:16,border:"1px solid "+(occasionState.budget===b?C.accent:C.border),
                          background:occasionState.budget===b?C.accent+"22":"transparent",
                          color:occasionState.budget===b?C.accent:C.text,fontFamily:FM,fontSize:11,cursor:"pointer"}}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>Guest dietary needs <span style={{fontWeight:400,color:C.muted}}>(optional)</span></div>
                  <input placeholder="e.g. nut allergy, vegetarian guest"
                    value={occasionState.guestRestrictions}
                    onChange={e=>setOccasionState(s=>({...s,guestRestrictions:e.target.value}))}
                    style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>🍷 Include Drink Pairings?</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setOccasionState(s=>({...s,includeDrinks:!s.includeDrinks}))}
                      style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+(occasionState.includeDrinks?"#7c3aed":C.border),
                      background:occasionState.includeDrinks?"#7c3aed22":"transparent",
                      color:occasionState.includeDrinks?"#7c3aed":C.muted,
                      fontFamily:FM,fontSize:12,cursor:"pointer",textAlign:"center"}}>
                      <div style={{fontSize:18,marginBottom:2}}>🍷</div>
                      <div style={{fontWeight:700}}>{occasionState.includeDrinks?"Yes — Include Pairings":"Add Wine & Drink Suggestions"}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:2}}>AI suggests drinks to match your meal</div>
                    </button>
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:FM,fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>Anything else? <span style={{fontWeight:400,color:C.muted}}>(optional)</span></div>
                  <input placeholder='"Something impressive but not fussy"'
                    value={occasionState.note}
                    onChange={e=>setOccasionState(s=>({...s,note:e.target.value}))}
                    style={{width:"100%",background:C.surface,border:"1px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontFamily:FM,fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setOccasionState({eventType:"",audienceType:"family",headCount:"",mode:"use",budget:"",guestRestrictions:"",note:"",includeDrinks:false});setOccasionCustomText("");setShowOccasionPlanner(false);}}
                    style={{...bBtn("ghost"),flex:1,padding:"11px"}}>Cancel</button>
                  <button onClick={planOccasionMeal} disabled={!occasionState.eventType}
                    style={{...bBtn("primary"),flex:2,padding:"11px",fontSize:14,opacity:occasionState.eventType?1:0.5}}>
                    Plan Occasion
                  </button>
                </div>
              </div>
            )}

            {/* STEP: LOADING */}
            {occasionStep==="loading"&&(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:40,marginBottom:16}}>
                  {OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType)?.emoji||"🍽"}
                </div>
                <div style={{fontFamily:FM,fontSize:14,color:C.muted}}>Planning your perfect {occasionCustomText||OCCASION_EVENT_TYPES.find(e=>e.key===occasionState.eventType)?.label||"occasion"} meal...</div>
              </div>
            )}

            {/* STEP: RESULT */}
            {occasionStep==="result"&&occasionResult&&(
              <div>
                <div style={{background:C.surface,borderRadius:12,padding:16,marginBottom:14,border:"1px solid "+C.border}}>
                  <div style={{fontFamily:FD,fontSize:18,color:C.accent,marginBottom:6}}>{occasionResult.meal}</div>
                  <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:10,lineHeight:1.5}}>{occasionResult.description}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:occasionResult.makeAheadTips?10:0}}>
                    {occasionResult.time&&<span style={bTag(C.muted)}>Time: {occasionResult.time}</span>}
                    {occasionResult.servings&&<span style={bTag(C.blue)}>Serves {occasionResult.servings}</span>}
                    {(occasionResult.shoppingNeeded||[]).length===0
                      ?<span style={bTag(C.green)}>All on hand</span>
                      :<span style={bTag(C.red)}>{occasionResult.shoppingNeeded.length} items needed</span>}
                  </div>
                  {occasionResult.makeAheadTips&&(
                    <div style={{background:C.accent+"12",borderRadius:8,padding:"8px 12px",marginTop:8}}>
                      <div style={{fontFamily:FM,fontSize:11,fontWeight:600,color:C.accent,marginBottom:3}}>Make-Ahead Tips</div>
                      <div style={{fontFamily:FM,fontSize:12,color:C.text,lineHeight:1.5}}>{occasionResult.makeAheadTips}</div>
                    </div>
                  )}
                  {(occasionResult.shoppingNeeded||[]).length>0&&(
                    <div style={{marginTop:10}}>
                      <div style={{fontFamily:FM,fontSize:11,fontWeight:600,color:C.muted,marginBottom:4}}>Need to buy:</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {occasionResult.shoppingNeeded.map((s,i)=>(
                          <span key={i} style={bTag(C.red)}>{s.name||s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {occasionResult.drinkPairings&&(
                    <div style={{background:"#7c3aed12",border:"1px solid #7c3aed33",borderRadius:8,padding:"8px 12px",marginTop:8}}>
                      <div style={{fontFamily:FM,fontSize:11,fontWeight:600,color:"#7c3aed",marginBottom:3}}>🍷 Drink Pairings</div>
                      <div style={{fontFamily:FM,fontSize:12,color:C.text,lineHeight:1.5}}>{occasionResult.drinkPairings}</div>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setOccasionStep("form")} style={{...bBtn("ghost"),flex:1,padding:"10px",fontSize:12}}>Change</button>
                  <button onClick={()=>setOccasionStep("date")} style={{...bBtn("primary"),flex:2,padding:"10px",fontSize:14}}>When is this? Pick Date</button>
                </div>
              </div>
            )}

            {/* STEP: DATE PICKER */}
            {occasionStep==="date"&&occasionResult&&(
              <div>
                <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.5}}>
                  Pick the date for <strong style={{color:C.text}}>{occasionResult.meal}</strong>.
                  If it falls within your current meal plan week, we will replace that day automatically.
                  Otherwise it goes straight to your Google Calendar.
                </div>
                <input type="date"
                  value={occasionDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e=>setOccasionDate(e.target.value)}
                  style={{width:"100%",background:C.surface,border:"2px solid "+C.accent,borderRadius:10,padding:"12px 14px",color:C.text,fontFamily:FM,fontSize:seniorMode?18:15,boxSizing:"border-box",marginBottom:20,outline:"none"}}/>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setOccasionStep("result")} style={{...bBtn("ghost"),flex:1,padding:"10px"}}>Back</button>
                  <button onClick={scheduleOccasionMeal} disabled={!occasionDate}
                    style={{...bBtn("primary"),flex:2,padding:"10px",fontSize:14,opacity:occasionDate?1:0.5}}>
                    Schedule It
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {makeThisModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:16}} onClick={()=>{if(!makeThisLoading){setMakeThisModal(false);}}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:28,maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontFamily:FD,fontSize:22,color:C.accent}}>🍽 Make This</div>
              <button onClick={()=>{if(!makeThisLoading){setMakeThisModal(false);setMakeThisResult(null);setMakeThisInput("");}}} style={{background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,cursor:"pointer",fontSize:16,lineHeight:1,padding:"4px 10px",fontWeight:600}} title="Close">✕ Close</button>
            </div>
            <div style={{fontFamily:FM,fontSize:13,color:C.muted,marginBottom:16}}>Type any dish — Claude will find the recipe and check your pantry.</div>
            {!makeThisResult?(
              <div>
                <input value={makeThisInput} onChange={e=>setMakeThisInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&makeThisInput.trim()&&!makeThisLoading&&(async()=>{setMakeThisLoading(true);const res=await callClaude({system:"Recipe AI. Return ONLY valid JSON, no markdown, no backticks.",prompt:"Give me a recipe for: "+makeThisInput.trim()+". Inventory available: "+inventory.map(i=>i.name).filter(Boolean).join(", ")+". Return JSON: {name,description,time,difficulty,servings,instructions:[5 strings],usesFromInventory:[ingredient names from inventory],missingIngredients:[items NOT in inventory]}."});try{const raw=(typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.[0]?.text||"").replace(/```json|```/g,"").trim();const s=raw.indexOf("{"),e2=raw.lastIndexOf("}");const p=JSON.parse(raw.slice(s,e2+1));setMakeThisResult(p);}catch(e){alert("Could not parse recipe. Try again.");}setMakeThisLoading(false);})()}  placeholder='e.g. "Peanut butter cookies"' style={{...bInp,marginBottom:14,fontSize:15}} autoFocus/>
                <button onClick={async()=>{if(!makeThisInput.trim())return;setMakeThisLoading(true);const res=await callClaude({system:"Recipe AI. Return ONLY valid JSON, no markdown, no backticks.",prompt:"Give me a recipe for: "+makeThisInput.trim()+". Inventory available: "+inventory.map(i=>i.name).filter(Boolean).join(", ")+". Return JSON: {name,description,time,difficulty,servings,instructions:[5 strings],usesFromInventory:[ingredient names from inventory],missingIngredients:[items NOT in inventory]}."});try{const raw=(typeof res==="string"?res:Array.isArray(res)?res.map(r=>r.text||"").join(""):res?.[0]?.text||"").replace(/```json|```/g,"").trim();const s=raw.indexOf("{"),e2=raw.lastIndexOf("}");const p=JSON.parse(raw.slice(s,e2+1));setMakeThisResult(p);}catch(e){alert("Could not parse recipe. Try again.");}setMakeThisLoading(false);}} disabled={!makeThisInput.trim()||makeThisLoading} style={{...bBtn("primary"),width:"100%",padding:"12px",fontSize:15,opacity:makeThisInput.trim()&&!makeThisLoading?1:0.5}}>{makeThisLoading?"Finding recipe...":"Find Recipe →"}</button>
              </div>
            ):(
              <div>
                {/* Recipe card — matches suggestion card style */}
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:18,marginBottom:14,cursor:"pointer"}} onClick={()=>setActiveRecipe({...makeThisResult,id:"makethis"})}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{fontFamily:FD,fontSize:19,color:C.accent,flex:1}}>🔍 {makeThisResult.name}</div>
                    <span style={bTag(makeThisResult.difficulty==="Easy"?C.green:makeThisResult.difficulty==="Hard"?C.red:C.accent)}>{makeThisResult.difficulty}</span>
                  </div>
                  {mealPhotos[makeThisResult.name]&&<div style={{marginBottom:10,borderRadius:8,overflow:"hidden"}}><img src={mealPhotos[makeThisResult.name]} alt={makeThisResult.name} style={{width:"100%",maxHeight:140,objectFit:"cover",display:"block",borderRadius:8}} /></div>}
                  <div style={{color:C.muted,fontSize:13,marginBottom:12,lineHeight:1.5}}>{makeThisResult.description}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {makeThisResult.time&&<span style={bTag(C.muted)}>⏱ {makeThisResult.time}</span>}
                    {makeThisResult.servings&&<span style={bTag(C.blue)}>🍽 {makeThisResult.servings} servings</span>}
                    {(makeThisResult.usesFromInventory||[]).length>0&&<span style={bTag(C.green)}>✅ {makeThisResult.usesFromInventory.length} on hand</span>}
                    {(makeThisResult.missingIngredients||[]).length>0&&<span style={bTag(C.red)}>🛒 {makeThisResult.missingIngredients.length} needed</span>}
                  </div>
                  {/* Star ratings */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:2}}>
                      {[1,2,3,4,5].map(star=>(
                        <button key={star} onClick={e=>{e.stopPropagation();const mealName=makeThisResult.name;setRecipeRatings(prev=>{const cur=prev[makeThisResult.name]?.rating||0;const next={...prev};if(cur===star){delete next[makeThisResult.name];}else{next[makeThisResult.name]={rating:star,recipe:makeThisResult};}try{localStorage.setItem("sk_recipeRatings",JSON.stringify(next));}catch{}if(star===5&&cur!==5){const skips=parseInt(localStorage.getItem("sk_photoSkipCount")||"0");if(skips<3) setTimeout(()=>setPhotoPromptMeal(mealName),300);}return next;});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:"0 1px",color:star<=(recipeRatings[makeThisResult.name]?.rating||0)?"#f59e0b":"#555"}}>
                          {star<=(recipeRatings[makeThisResult.name]?.rating||0)?"★":"☆"}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span onClick={e=>{e.stopPropagation();setActiveRecipe(makeThisResult);}} style={{fontSize:11,color:C.accent,fontFamily:FM,letterSpacing:0.5,cursor:"pointer"}}>TAP FOR FULL RECIPE →</span>
                      <a href={getRecipeUrl(makeThisResult.name)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:10,color:"#60a5fa",fontFamily:FM,textDecoration:"none",fontWeight:600}}>🌐 web</a>
                      <button onClick={e=>{e.stopPropagation();setPhotoPromptMeal(makeThisResult.name);}} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:6,color:C.muted,fontFamily:FM,fontSize:12,cursor:"pointer",padding:"6px 10px"}} title="Add photo">📸 {mealPhotos[makeThisResult.name]?"Change":"Photo"}</button>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>printRecipeCard(makeThisResult,mealPhotos[makeThisResult.name])} style={{...bBtn("ghost"),padding:"10px 12px",fontSize:12}}>🖨 Print</button>
                  <button onClick={()=>{setMakeThisResult(null);setMakeThisInput("");}} style={{...bBtn("ghost"),flex:1,padding:"10px"}}>← Try Another</button>
                  <button onClick={()=>setMakeThisModal(false)} style={{...bBtn("primary"),flex:1,padding:"10px"}}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {familyRecipesOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}} onClick={()=>{if(!frLoading){setFamilyRecipesOpen(false);setFrAddMode(null);setFrEditRecipe(null);setFrViewRecipe(null);}}}>
          <div style={{background:"#fdf6ec",borderRadius:18,padding:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 48px rgba(0,0,0,0.5)",border:"3px solid #c8963e"}} onClick={e=>e.stopPropagation()}>

            {/* ── VIEW RECIPE ── */}
            {frViewRecipe&&!frEditRecipe&&(<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?28:22,color:"#5c3317",lineHeight:1.2}}>{frViewRecipe.name}</div>
                  {frViewRecipe.kitchenOf&&<div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#8b6340",fontStyle:"italic",marginTop:2}}>From the kitchen of {frViewRecipe.kitchenOf}</div>}
                </div>
                <button onClick={()=>setFrViewRecipe(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#8b6340",padding:"0 4px"}}>✕</button>
              </div>
              {frViewRecipe.photo
  ?<div style={{position:"relative",marginBottom:14}}>
    <img src={frViewRecipe.photo} alt={frViewRecipe.name} style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10,border:"2px solid #e8d5b0"}}/>
    <div style={{position:"absolute",bottom:8,right:8,display:"flex",gap:6}}>
    <button onClick={()=>document.getElementById("fr-dish-camera").click()} style={{background:"rgba(92,51,23,0.75)",border:"none",borderRadius:20,padding:"6px 10px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:11,cursor:"pointer"}}>📷 Camera</button>
    <button onClick={()=>document.getElementById("fr-dish-gallery").click()} style={{background:"rgba(92,51,23,0.75)",border:"none",borderRadius:20,padding:"6px 10px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:11,cursor:"pointer"}}>🖼 Gallery</button>
  </div>
  </div>
  :<div style={{marginBottom:14,display:"flex",gap:10}}>
    <button onClick={()=>document.getElementById("fr-dish-camera").click()} style={{flex:1,background:"#fffbf0",border:"2px dashed #e8d5b0",borderRadius:10,padding:"16px 10px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#8b6340",textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:4}}>📷</div>Take a Photo
    </button>
    <button onClick={()=>document.getElementById("fr-dish-gallery").click()} style={{flex:1,background:"#fffbf0",border:"2px dashed #e8d5b0",borderRadius:10,padding:"16px 10px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#8b6340",textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:4}}>🖼</div>Choose from Gallery
    </button>
  </div>}
<input id="fr-dish-camera" type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement("canvas");
      const max=600;const scale=Math.min(max/img.width,max/img.height,1);
      canvas.width=img.width*scale;canvas.height=img.height*scale;
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      const compressed=canvas.toDataURL("image/jpeg",0.65);
      const updated={...frViewRecipe,photo:compressed};
      setFrViewRecipe(updated);
      const updatedList=familyRecipes.map(r=>r.id===frViewRecipe.id?updated:r);
      setFamilyRecipes(updatedList);
      try{localStorage.setItem("sk_familyRecipes",JSON.stringify(updatedList));}catch{}
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value="";
}}/>
<input id="fr-dish-gallery" type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement("canvas");
      const max=600;const scale=Math.min(max/img.width,max/img.height,1);
      canvas.width=img.width*scale;canvas.height=img.height*scale;
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      const compressed=canvas.toDataURL("image/jpeg",0.65);
      const updated={...frViewRecipe,photo:compressed};
      setFrViewRecipe(updated);
      const updatedList=familyRecipes.map(r=>r.id===frViewRecipe.id?updated:r);
      setFamilyRecipes(updatedList);
      try{localStorage.setItem("sk_familyRecipes",JSON.stringify(updatedList));}catch{}
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value="";
}}/>
              <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,background:"#fef3c7",borderRadius:20,padding:"4px 12px",border:"1px solid #f59e0b"}}>
                  <span style={{fontSize:14}}>🍽</span>
                  <span style={{fontFamily:"Georgia,serif",fontSize:13,color:"#92400e",fontWeight:700}}>Serves</span>
                  <button onClick={()=>setFrServings(s=>Math.max(1,s-1))} style={{background:"#f59e0b",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:12,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>−</button>
                  <span style={{fontFamily:"Georgia,serif",fontSize:15,color:"#92400e",fontWeight:700,minWidth:16,textAlign:"center"}}>{frServings}</span>
                  <button onClick={()=>setFrServings(s=>s+1)} style={{background:"#f59e0b",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:12,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
                </div>
                {frViewRecipe.rotation&&<span style={{background:"#dcfce7",border:"1px solid #16a34a",borderRadius:20,padding:"4px 10px",fontSize:12,color:"#166534",fontFamily:"Georgia,serif"}}>🔄 {frViewRecipe.frequency==="weekly"?"Weekly":frViewRecipe.frequency==="4week"?"Monthly":"Seasonal"}</span>}
                {(frViewRecipe.seasons||[]).map(s=><span key={s} style={{background:"#ede9fe",border:"1px solid #7c3aed",borderRadius:20,padding:"4px 10px",fontSize:12,color:"#5b21b6",fontFamily:"Georgia,serif"}}>{s}</span>)}
              </div>
              <div style={{background:"#fffbf0",border:"1px solid #e8d5b0",borderRadius:10,padding:14,marginBottom:14}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,fontWeight:700,color:"#5c3317",marginBottom:8,borderBottom:"1px dashed #e8d5b0",paddingBottom:6}}>Ingredients</div>
                {(frViewRecipe.ingredients||[]).filter(ing=>ing&&ing.trim()).map((ing,i)=>{
                  const base=frViewRecipe.servings||4;
                  const scale=frServings/base;
                  const match=ing.match(/^([\d.\/]+)\s*(.*)/);
                  const scaled=match?((parseFloat(match[1])*scale)%1===0?(parseFloat(match[1])*scale).toString():(parseFloat(match[1])*scale).toFixed(1))+" "+match[2]:ing;
                  return <div key={i} style={{fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,color:"#3d2008",padding:"4px 0",borderBottom:"1px dotted #e8d5b0"}}>• {scaled}</div>;
                })}
              </div>
              <div style={{background:"#fffbf0",border:"1px solid #e8d5b0",borderRadius:10,padding:14,marginBottom:14}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,fontWeight:700,color:"#5c3317",marginBottom:8,borderBottom:"1px dashed #e8d5b0",paddingBottom:6}}>Instructions</div>
                {(frViewRecipe.steps||[]).filter(step=>step&&step.trim()).map((step,i)=><div key={i} style={{fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,color:"#3d2008",marginBottom:8,display:"flex",gap:8,lineHeight:1.6}}><span style={{fontWeight:700,color:"#c8963e",flexShrink:0}}>{i+1}.</span><span>{step}</span></div>)}
              </div>
              {frViewRecipe.notes&&<div style={{background:"#fef9f0",border:"1px dashed #c8963e",borderRadius:10,padding:12,marginBottom:14,fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#8b6340",fontStyle:"italic"}}>💛 {frViewRecipe.notes}</div>}
              <div style={{position:"sticky",bottom:0,background:"#fdf6ec",paddingTop:10,paddingBottom:4,marginTop:4}}>
                <button onClick={()=>setFrViewRecipe(null)} style={{width:"100%",background:"transparent",border:"2px solid #e8d5b0",borderRadius:10,padding:"11px",color:"#8b6340",fontFamily:"Georgia,serif",fontSize:16,cursor:"pointer",fontWeight:700}}>✕ Close Recipe</button>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>{
                  const r=frViewRecipe;
                  const scale=frServings/(r.servings||4);
                  const scaledIngs=(r.ingredients||[]).filter(i=>i&&i.trim()).map(ing=>{
                    const m=ing.match(/^([0-9./]+)\s*(.*)/);
                    if(!m)return ing;
                    const n=parseFloat(m[1])*scale;
                    return (n%1===0?n:n.toFixed(1))+" "+m[2];
                  });
                  const css="@page{margin:2cm;size:portrait;}body{font-family:Georgia,serif;padding:40px 48px;color:#3d2008;margin:0;background:#fffdf8;}.header{border-bottom:3px solid #c8963e;padding-bottom:16px;margin-bottom:20px;}.title{font-size:34px;font-weight:700;color:#5c3317;margin:0 0 6px 0;line-height:1.2;}.kitchen-of{font-size:15px;font-style:italic;color:#8b6340;margin:0 0 10px 0;}.meta{display:flex;gap:12px;font-size:13px;color:#8b6340;margin-bottom:4px;flex-wrap:wrap;}.meta span{background:#fef3c7;border:1px solid #f59e0b;border-radius:20px;padding:3px 12px;}.photo{width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-bottom:20px;border:2px solid #e8d5b0;}.section{margin-bottom:20px;}.section-title{font-size:15px;font-weight:700;color:#5c3317;text-transform:uppercase;letter-spacing:1px;border-bottom:1px dashed #e8d5b0;padding-bottom:6px;margin-bottom:10px;}.ingredient{font-size:14px;color:#3d2008;padding:5px 0;border-bottom:1px dotted #e8d5b0;}.step{font-size:14px;color:#3d2008;margin-bottom:10px;display:flex;gap:10px;line-height:1.6;}.step-num{font-size:15px;font-weight:700;color:#c8963e;flex-shrink:0;min-width:20px;}.notes{background:#fef9f0;border:1px dashed #c8963e;border-radius:8px;padding:12px 16px;font-size:13px;font-style:italic;color:#8b6340;margin-bottom:20px;}.footer{border-top:2px solid #e8d5b0;padding-top:12px;margin-top:24px;display:flex;justify-content:space-between;}.brand{font-size:13px;color:#c8963e;font-weight:700;}.url{font-size:11px;color:#aaa;}@media print{body{background:white;padding:0;}}";
                  const photo=r.photo?"<img class='photo' src='"+r.photo+"'/>":"";
                  const kitchenOf=r.kitchenOf?"<div class='kitchen-of'>From the kitchen of "+r.kitchenOf+"</div>":"";
                  const seasons=(r.seasons||[]).map(s=>"<span>"+s+"</span>").join("");
                  const ings=scaledIngs.map(i=>"<div class='ingredient'>&#8226; "+i+"</div>").join("");
                  const steps=(r.steps||[]).filter(s=>s&&s.trim()).map((s,i)=>"<div class='step'><span class='step-num'>"+(i+1)+".</span><span>"+s+"</span></div>").join("");
                  const notes=r.notes?"<div class='notes'>"+r.notes+"</div>":"";
                  const html="<!DOCTYPE html><html><head><title>"+r.name+"</title><meta charset='utf-8'/><style>"+css+"</style></head><body>"
                    +"<div class='header'><div class='title'>"+r.name+"</div>"+kitchenOf
                    +"<div class='meta'><span>Serves "+frServings+"</span>"+seasons+"</div></div>"
                    +photo
                    +"<div class='section'><div class='section-title'>Ingredients</div>"+ings+"</div>"
                    +"<div class='section'><div class='section-title'>Instructions</div>"+steps+"</div>"
                    +notes
                    +"<div class='footer'><span class='brand'>Smart Kitchen&#8482;</span><span class='url'>smart-kitchen-opal.vercel.app</span></div>"
                    +"</body></html>";
                  const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                  if(isMobile){
                    const blob=new Blob([html],{type:"text/html"});
                    const url=URL.createObjectURL(blob);
                    const iframe=document.createElement("iframe");
                    iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:9999;background:white;";
                    iframe.src=url;
                    document.body.appendChild(iframe);
                    iframe.onload=()=>{
                      setTimeout(()=>{
                        iframe.contentWindow.print();
                        setTimeout(()=>{document.body.removeChild(iframe);URL.revokeObjectURL(url);},1000);
                      },400);
                    };
                  } else {
                    const w=window.open("","_blank","width=750,height=950");
                    w.document.write(html);
                    w.document.close();w.focus();setTimeout(()=>{w.print();w.close();},600);
                  }
                }} style={{flex:1,background:"#5c3317",border:"none",borderRadius:10,padding:"12px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,cursor:"pointer",fontWeight:700}}>🖨 Print Recipe</button>
                <button onClick={()=>{
                  const missing=(frViewRecipe.ingredients||[]).filter(ing=>{
                    const name=ing.replace(/^[\d.\/\s]+[a-zA-Z]*\s*/,"").toLowerCase().trim();
                    return !inventory.some(i=>(i.name||"").toLowerCase().includes(name.split(" ")[0]));
                  });
                  if(missing.length===0){alert("You have all the ingredients on hand!");}
                  else{
                    const existing=JSON.parse(localStorage.getItem("sk_shoppingList")||"[]");
                    const added=missing.filter(m=>!existing.some(e=>e.name===m));
                    localStorage.setItem("sk_shoppingList",JSON.stringify([...existing,...added.map(m=>({name:m,checked:false,source:"Family Recipe: "+frViewRecipe.name}))]));
                    alert(added.length+" ingredient"+(added.length!==1?"s":"")+" added to your shopping list!");
                  }
                }} style={{flex:1,background:"#5c3317",border:"none",borderRadius:10,padding:"12px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,cursor:"pointer",fontWeight:700}}>🛒 Add Missing to Shopping List</button>
                <button onClick={()=>{
                  setShareSelected({[frViewRecipe.name]:{...frViewRecipe,isFamilyRecipe:true}});
                  setShareTitle(frViewRecipe.name+(frViewRecipe.kitchenOf?" — From the kitchen of "+frViewRecipe.kitchenOf:""));
                  setShareMode(true);
                  setShowShareModal(true);
                }} style={{background:"transparent",border:"2px solid #c8963e",borderRadius:10,padding:"10px 16px",color:"#c8963e",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,cursor:"pointer",fontWeight:600}}>📤 Share</button>
                <button onClick={()=>{
                  if(!recipeRatings[frViewRecipe.name]){
                    setRecipeRatings(p=>({...p,[frViewRecipe.name]:{rating:4,recipe:{...frViewRecipe,isFamilyRecipe:false}}}));
                    alert(frViewRecipe.name+" added to Saved Recipes!");
                  } else { alert(frViewRecipe.name+" is already in Saved Recipes."); }
                }} style={{background:"transparent",border:"2px solid #5b9cf6",borderRadius:10,padding:"10px 16px",color:"#5b9cf6",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,cursor:"pointer"}}>⭐ Add to Saved</button>
                <button onClick={()=>{setFrEditRecipe({...frViewRecipe});setFrServings(frViewRecipe.servings||4);}} style={{background:"transparent",border:"2px solid #c8963e",borderRadius:10,padding:"10px 16px",color:"#5c3317",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,cursor:"pointer"}}>✏ Edit</button>
                <button onClick={()=>{if(window.confirm("Delete "+frViewRecipe.name+"?")){const updated=familyRecipes.filter(r=>r.id!==frViewRecipe.id);setFamilyRecipes(updated);try{localStorage.setItem("sk_familyRecipes",JSON.stringify(updated));}catch{}setFrViewRecipe(null);}}} style={{background:"transparent",border:"2px solid #dc2626",borderRadius:10,padding:"10px 16px",color:"#dc2626",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,cursor:"pointer"}}>🗑 Delete</button>
              </div>
            </div>)}

            {/* ── EDIT / REVIEW RECIPE ── */}
            {frEditRecipe&&(<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?22:18,color:"#5c3317",fontWeight:700}}>✏ Edit Recipe</div>
                <button onClick={()=>setFrEditRecipe(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#8b6340"}}>✕</button>
              </div>
              {[["Recipe Name","name"],["From the Kitchen of (optional)","kitchenOf"],["Family Notes (optional)","notes"]].map(([label,field])=>(
                <div key={field} style={{marginBottom:10}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:12,color:"#8b6340",marginBottom:4}}>{label}</div>
                  <input value={frEditRecipe[field]||""} onChange={e=>setFrEditRecipe(r=>({...r,[field]:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e8d5b0",fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,color:"#3d2008",background:"#fffbf0",boxSizing:"border-box"}}/>
                </div>
              ))}
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:12,color:"#8b6340",marginBottom:4}}>Servings</div>
                <input type="number" value={frEditRecipe.servings||""} placeholder="4" onChange={e=>setFrEditRecipe(r=>({...r,servings:parseInt(e.target.value)||4}))} style={{width:80,padding:"8px 12px",borderRadius:8,border:"1px solid #e8d5b0",fontFamily:"Georgia,serif",fontSize:13,color:"#3d2008",background:"#fffbf0"}}/>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:12,color:"#8b6340",marginBottom:6}}>Ingredients (one per line)</div>
                <textarea value={(frEditRecipe.ingredients||[]).join("\n")} onChange={e=>setFrEditRecipe(r=>({...r,ingredients:e.target.value.split("\n")}))} rows={5} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e8d5b0",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#3d2008",background:"#fffbf0",boxSizing:"border-box",resize:"vertical"}}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:12,color:"#8b6340",marginBottom:6}}>Steps (one per line)</div>
                <textarea value={(frEditRecipe.steps||[]).join("\n")} onChange={e=>setFrEditRecipe(r=>({...r,steps:e.target.value.split("\n")}))} rows={6} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e8d5b0",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#3d2008",background:"#fffbf0",boxSizing:"border-box",resize:"vertical"}}/>
              </div>
              <div style={{background:"#fef9f0",border:"1px solid #e8d5b0",borderRadius:10,padding:14,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <input type="checkbox" checked={frEditRecipe.rotation||false} onChange={e=>setFrEditRecipe(r=>({...r,rotation:e.target.checked}))} style={{width:18,height:18,cursor:"pointer",accentColor:"#c8963e"}}/>
                  <span style={{fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,color:"#5c3317",fontWeight:700}}>Include in meal plan rotation</span>
                </div>
                {frEditRecipe.rotation&&(<>
                  <div style={{fontFamily:"Georgia,serif",fontSize:12,color:"#8b6340",marginBottom:6}}>How often?</div>
                  <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                    {[["weekly","Weekly"],["4week","Monthly"],["seasonal","Seasonal"]].map(([val,label])=>(
                      <button key={val} onClick={()=>setFrEditRecipe(r=>({...r,frequency:val}))} style={{padding:"6px 14px",borderRadius:20,border:"2px solid "+(frEditRecipe.frequency===val?"#c8963e":"#e8d5b0"),background:frEditRecipe.frequency===val?"#fef3c7":"transparent",fontFamily:"Georgia,serif",fontSize:12,color:frEditRecipe.frequency===val?"#92400e":"#8b6340",cursor:"pointer",fontWeight:frEditRecipe.frequency===val?700:400}}>{label}</button>
                    ))}
                  </div>
                  {frEditRecipe.frequency==="seasonal"&&(<>
                    <div style={{fontFamily:"Georgia,serif",fontSize:12,color:"#8b6340",marginBottom:6}}>Seasons & Holidays</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {["🌸 Spring","☀ Summer","🍂 Fall","❄ Winter","🎄 Christmas","🦃 Thanksgiving","🐣 Easter","🎆 Fourth of July"].map(s=>{
                        const active=(frEditRecipe.seasons||[]).includes(s);
                        return <button key={s} onClick={()=>setFrEditRecipe(r=>({...r,seasons:active?(r.seasons||[]).filter(x=>x!==s):[...(r.seasons||[]),s]}))} style={{padding:"5px 10px",borderRadius:20,border:"2px solid "+(active?"#7c3aed":"#e8d5b0"),background:active?"#ede9fe":"transparent",fontFamily:"Georgia,serif",fontSize:11,color:active?"#5b21b6":"#8b6340",cursor:"pointer"}}>{s}</button>;
                      })}
                    </div>
                  </>)}
                </>)}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{
                  const saved={...frEditRecipe,id:frEditRecipe.id||Date.now()};
                  const existing=familyRecipes.find(r=>r.id===saved.id);
                  const updated=existing?familyRecipes.map(r=>r.id===saved.id?saved:r):[...familyRecipes,saved];
                  setFamilyRecipes(updated);
                  try{localStorage.setItem("sk_familyRecipes",JSON.stringify(updated));}catch{}
                  setFrEditRecipe(null);
                  setFrAddMode(null);
                  setFrViewRecipe(saved);
                }} style={{flex:2,background:"#5c3317",border:"none",borderRadius:10,padding:"13px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:seniorMode?17:14,cursor:"pointer",fontWeight:700}}>💾 Save Recipe</button>
                <button onClick={()=>setFrEditRecipe(null)} style={{flex:1,background:"transparent",border:"2px solid #e8d5b0",borderRadius:10,padding:"11px",color:"#8b6340",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>)}

            {/* ── ADD MODE PICKER ── */}
            {frAddMode==="pick"&&!frEditRecipe&&!frViewRecipe&&(<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?22:18,color:"#5c3317",fontWeight:700}}>📖 Add a Family Recipe</div>
                <button onClick={()=>setFrAddMode(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#8b6340"}}>✕</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={()=>{setFrAddMode("type");setFrEditRecipe({name:"",kitchenOf:"",notes:"",servings:4,ingredients:[],steps:[],rotation:false,frequency:"4week",seasons:[],photo:null});}} style={{background:"#fffbf0",border:"2px solid #e8d5b0",borderRadius:12,padding:"16px",textAlign:"left",cursor:"pointer"}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?18:15,color:"#5c3317",fontWeight:700,marginBottom:4}}>✏ Type it in</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?14:12,color:"#8b6340"}}>Enter the recipe name, ingredients, and steps yourself</div>
                </button>
                <button onClick={()=>setFrAddMode("photo")} style={{background:"#fffbf0",border:"2px solid #e8d5b0",borderRadius:12,padding:"16px",textAlign:"left",cursor:"pointer"}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?18:15,color:"#5c3317",fontWeight:700,marginBottom:4}}>📸 Photo of a written recipe</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?14:12,color:"#8b6340"}}>Take a photo of a handwritten or printed recipe and AI will read it</div>
                </button>
                <button onClick={()=>setFrAddMode("idea")} style={{background:"#fffbf0",border:"2px solid #e8d5b0",borderRadius:12,padding:"16px",textAlign:"left",cursor:"pointer"}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?18:15,color:"#5c3317",fontWeight:700,marginBottom:4}}>💡 I have an idea for a recipe</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?14:12,color:"#8b6340"}}>Describe it and AI will build a full recipe card with ingredients and steps</div>
                </button>
              </div>
            </div>)}

            {/* ── PHOTO SCAN ── */}
            {frAddMode==="photo"&&!frEditRecipe&&(<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?22:18,color:"#5c3317",fontWeight:700}}>📸 Photo Recipe Scan</div>
                <button onClick={()=>{setFrAddMode("pick");setFrPhotos([]);}} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#8b6340"}}>✕</button>
              </div>
              <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?14:12,color:"#8b6340",marginBottom:10,lineHeight:1.6}}>Add as many photos as needed — front and back, multiple pages, recipe cards. AI will read them all and build one complete recipe card.</div>
              {/* Photo thumbnails */}
              {frPhotos.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {frPhotos.map((p,i)=>(
                  <div key={i} style={{position:"relative",width:72,height:72}}>
                    <img src={p.preview} style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:"2px solid #e8d5b0"}} alt={"Page "+(i+1)}/>
                    <div style={{position:"absolute",top:-6,right:-6,background:"#5c3317",color:"#fdf6ec",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,cursor:"pointer"}} onClick={()=>setFrPhotos(prev=>prev.filter((_,j)=>j!==i))}>✕</div>
                    <div style={{position:"absolute",bottom:2,left:0,right:0,textAlign:"center",fontFamily:"Georgia,serif",fontSize:9,color:"#fff",background:"rgba(92,51,23,0.6)",borderRadius:"0 0 6px 6px"}}>Photo {i+1}</div>
                  </div>
                ))}
                {/* Add another photo tile */}
                <div style={{width:72,height:72,border:"2px dashed #e8d5b0",borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#fffbf0"}} onClick={()=>document.getElementById("fr-photo-gallery").click()}>
                  <div style={{fontSize:22}}>📷</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:9,color:"#8b6340",marginTop:2}}>Add</div>
                </div>
              </div>}
              {/* Empty state drop zone */}
              {frPhotos.length===0&&<div style={{display:"flex",gap:10,marginBottom:14}}>
                <button onClick={()=>document.getElementById("fr-photo-camera").click()} style={{flex:1,background:"#fffbf0",border:"2px dashed #e8d5b0",borderRadius:12,padding:"20px 10px",textAlign:"center",cursor:"pointer"}}>
                  <div style={{fontSize:36,marginBottom:6}}>📷</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#8b6340"}}>Take a Photo</div>
                </button>
                <button onClick={()=>document.getElementById("fr-photo-gallery").click()} style={{flex:1,background:"#fffbf0",border:"2px dashed #e8d5b0",borderRadius:12,padding:"20px 10px",textAlign:"center",cursor:"pointer"}}>
                  <div style={{fontSize:36,marginBottom:6}}>🖼</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,color:"#8b6340"}}>Choose from Gallery</div>
                </button>
              </div>}
              <input id="fr-photo-camera" type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{
                const file=e.target.files[0];
                if(!file)return;
                const reader=new FileReader();
                reader.onload=ev=>{
                  const preview=ev.target.result;
                  const b64=preview.split(",")[1];
                  setFrPhotos(prev=>[...prev,{preview,b64}]);
                };
                reader.readAsDataURL(file);
                e.target.value="";
              }}/>
              <input id="fr-photo-gallery" type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{
                const files=Array.from(e.target.files);
                if(!files.length)return;
                files.forEach(file=>{
                  const reader=new FileReader();
                  reader.onload=ev=>{
                    const preview=ev.target.result;
                    const b64=preview.split(",")[1];
                    setFrPhotos(prev=>[...prev,{preview,b64}]);
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value="";
              }}/>
              {frPhotos.length>0&&<div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>document.getElementById("fr-photo-gallery").click()} style={{flex:1,background:"transparent",border:"2px solid #c8963e",borderRadius:10,padding:"11px",color:"#5c3317",fontFamily:"Georgia,serif",fontSize:seniorMode?15:13,cursor:"pointer",fontWeight:700}}>+ Add Another Photo</button>
                <button onClick={async()=>{
                  setFrLoading(true);
                  try{
                    const photoDesc=frPhotos.map((p,i)=>"Photo "+(i+1)).join(", ");
                    const prompt="I am sending you "+(frPhotos.length>1?frPhotos.length+" photos of a recipe ("+photoDesc+"). Read all photos together and combine into one complete recipe.":"a photo of a recipe. Read it and extract all details.")+" Return ONLY valid JSON with no markdown: {name,kitchenOf,servings,ingredients:[strings with amounts],steps:[strings],notes}. kitchenOf is the person's name if written on the recipe — empty string if not present. Combine all pages into one complete recipe.";
                    const res=await callClaude({
                      system:"You are a recipe reader. Extract recipes from images and return ONLY valid JSON, no markdown, no backticks.",
                      prompt,
                      imageB64:frPhotos[0].b64,
                      extraImages:frPhotos.slice(1).map(p=>p.b64),
                      maxTokens:1600
                    });
                    const raw=(typeof res==="string"?res:res?.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
                    const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
                    const parsed=JSON.parse(raw.slice(s,e+1));
                    const parsedServings=parseInt(parsed.servings)||4;
                  setFrEditRecipe({...parsed,id:Date.now(),servings:parsedServings,rotation:false,frequency:"4week",seasons:[],photo:null});
                    setFrServings(parsedServings);
                    setFrPhotos([]);
                    setFrAddMode("review");
                  }catch(err){alert("Could not read recipe. Try clearer photos or better lighting.");}
                  setFrLoading(false);
                }} disabled={frLoading} style={{flex:2,background:"#5c3317",border:"none",borderRadius:10,padding:"13px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:seniorMode?17:14,cursor:"pointer",fontWeight:700,opacity:frLoading?0.6:1}}>{frLoading?"Reading "+(frPhotos.length>1?"all "+frPhotos.length+" photos":"recipe")+"...":"Read Recipe →"+(frPhotos.length>1?" ("+frPhotos.length+" photos)":"")}</button>
              </div>}
            </div>)}

            {/* ── IDEA ── */}
            {frAddMode==="idea"&&!frEditRecipe&&(<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?22:18,color:"#5c3317",fontWeight:700}}>💡 Recipe Idea</div>
                <button onClick={()=>setFrAddMode("pick")} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#8b6340"}}>✕</button>
              </div>
              <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?15:13,color:"#8b6340",marginBottom:10,lineHeight:1.6}}>Describe your recipe idea — as much or as little as you know. AI will create a full recipe card.</div>
              <textarea value={frIdeaInput} onChange={e=>setFrIdeaInput(e.target.value)} placeholder={'e.g. "Grandma\'s chicken casserole with cream of mushroom soup and egg noodles" or "A hearty winter beef stew"'} rows={4} style={{width:"100%",padding:"12px",borderRadius:10,border:"2px solid #e8d5b0",fontFamily:"Georgia,serif",fontSize:seniorMode?16:13,color:"#3d2008",background:"#fffbf0",boxSizing:"border-box",resize:"none",marginBottom:14}}/>
              <button onClick={async()=>{
                if(!frIdeaInput.trim())return;
                setFrLoading(true);
                try{
                  const res=await callClaude({system:"You are a recipe creator. Create a complete family-style recipe and return ONLY valid JSON with no markdown: {name,kitchenOf,servings,ingredients:[strings with amounts],steps:[strings],notes}. kitchenOf should be empty string. Make it warm, homey, and practical.",prompt:"Create a complete recipe for: "+frIdeaInput.trim()+". Inventory available: "+inventory.map(i=>i.name).filter(Boolean).join(", "),maxTokens:1200});
                  const raw=(typeof res==="string"?res:res?.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
                  const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
                  const parsed=JSON.parse(raw.slice(s,e+1));
                  setFrEditRecipe({...parsed,id:Date.now(),rotation:false,frequency:"4week",seasons:[],photo:null});
                  setFrServings(parsed.servings||4);
                  setFrAddMode("review");
                }catch(err){alert("Could not create recipe. Please try again.");}
                setFrLoading(false);
              }} disabled={!frIdeaInput.trim()||frLoading} style={{width:"100%",background:"#5c3317",border:"none",borderRadius:10,padding:"13px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:seniorMode?17:14,cursor:frIdeaInput.trim()&&!frLoading?"pointer":"default",fontWeight:700,opacity:frIdeaInput.trim()&&!frLoading?1:0.5}}>{frLoading?"Creating recipe...":"Create Recipe Card →"}</button>
            </div>)}

            {/* ── RECIPE LIST (home screen) ── */}
            {!frAddMode&&!frEditRecipe&&!frViewRecipe&&(<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?26:20,color:"#5c3317",fontWeight:700}}>📖 Family Recipes</div>
                <button onClick={()=>{const frObj={};familyRecipes.forEach(r=>{frObj[r.name]={...r,isFamilyRecipe:true};});setShareSelected(frObj);setShareTitle("Family Recipes"+(familyProfiles[0]?.name?" from "+familyProfiles[0].name:""));setShareMode(true);setShowShareModal(true);}} style={{background:"transparent",border:"2px solid #c8963e",borderRadius:10,padding:seniorMode?"10px 16px":"7px 12px",color:"#c8963e",fontFamily:"Georgia,serif",fontSize:seniorMode?15:12,cursor:"pointer",fontWeight:600}}>📤 Share All
                </button>
                <button onClick={()=>setFamilyRecipesOpen(false)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#8b6340"}}>✕</button>
              </div>
              {familyRecipes.length===0&&<div style={{textAlign:"center",padding:"30px 0"}}>
                <div style={{fontSize:48,marginBottom:12}}>🫙</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?17:14,color:"#8b6340",lineHeight:1.8}}>Your family recipe box is empty.<br/>Add your first recipe to get started.</div>
              </div>}
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                {familyRecipes.map(r=>(
                  <div key={r.id} onClick={()=>{setFrViewRecipe(r);setFrServings(r.servings||4);}} style={{background:"#fffbf0",border:"2px solid #e8d5b0",borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",gap:12,alignItems:"center",boxShadow:"0 2px 8px rgba(92,51,23,0.08)",transition:"border-color 0.15s"}}
                    onMouseOver={e=>e.currentTarget.style.borderColor="#c8963e"}
                    onMouseOut={e=>e.currentTarget.style.borderColor="#e8d5b0"}>
                    {r.photo&&<img src={r.photo} alt={r.name} style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0,border:"1px solid #e8d5b0"}}/>}
                    {!r.photo&&<div style={{width:56,height:56,borderRadius:8,background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🍲</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?18:15,color:"#5c3317",fontWeight:700,marginBottom:2}}>{r.name}</div>
                      {r.kitchenOf&&<div style={{fontFamily:"Georgia,serif",fontSize:seniorMode?13:11,color:"#8b6340",fontStyle:"italic",marginBottom:4}}>From the kitchen of {r.kitchenOf}</div>}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {r.rotation&&<span style={{background:"#dcfce7",border:"1px solid #16a34a",borderRadius:20,padding:"2px 8px",fontSize:10,color:"#166534",fontFamily:"Georgia,serif"}}>{r.frequency==="weekly"?"Weekly":r.frequency==="4week"?"Monthly":"Seasonal"}</span>}
                        {(r.seasons||[]).slice(0,2).map(s=><span key={s} style={{background:"#ede9fe",border:"1px solid #7c3aed",borderRadius:20,padding:"2px 8px",fontSize:10,color:"#5b21b6",fontFamily:"Georgia,serif"}}>{s}</span>)}
                      </div>
                    </div>
                    <span style={{color:"#c8963e",fontSize:18,flexShrink:0}}>›</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>setFrAddMode("pick")} style={{width:"100%",background:"#5c3317",border:"none",borderRadius:12,padding:"14px",color:"#fdf6ec",fontFamily:"Georgia,serif",fontSize:seniorMode?18:15,cursor:"pointer",fontWeight:700}}>+ Add a Family Recipe</button>
            </div>)}

          </div>
        </div>
      )}
      {/* == LABEL PRINT MODAL == */}
      {labelModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:18,padding:24,maxWidth:620,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:FD,fontSize:20,color:C.accent}}>🏷 Print Labels</div>
              <button onClick={()=>setLabelModal(false)} style={{background:"transparent",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>
            </div>
            {/* Format picker */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontFamily:FM,color:C.muted,letterSpacing:0.8,marginBottom:8}}>LABEL FORMAT</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[
                  {id:"5160",name:"Avery 5160",desc:"30 per sheet, 2.625in x 1in",note:"Pantry jars, small bags"},
                  {id:"5163",name:"Avery 5163",desc:"10 per sheet, 4in x 2in",note:"Freezer bags, vacuum packs"},
                  {id:"5164",name:"Avery 5164",desc:"6 per sheet, 4in x 3.33in",note:"Large containers, canning jars"},
                ].map(f=>(
                  <button key={f.id} onClick={()=>setLabelFormat(f.id)} style={{background:labelFormat===f.id?"#1a2e1a":C.surface,border:"1px solid "+(labelFormat===f.id?"#4c4":C.border),borderRadius:10,padding:"10px 14px",cursor:"pointer",textAlign:"left",flex:1,minWidth:160}}>
                    <div style={{fontSize:13,fontWeight:700,color:labelFormat===f.id?"#4c4":C.text}}>{f.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{f.desc}</div>
                    <div style={{fontSize:10,color:C.dim,marginTop:2}}>{f.note}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Item selector */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontFamily:FM,color:C.muted,letterSpacing:0.8,marginBottom:8}}>SELECT ITEMS TO LABEL</div>
              <div style={{fontSize:11,color:C.dim,marginBottom:8}}>Defaults to one label per package on hand — adjust the count if you don't need a label for every one.</div>
              {(()=>{
                const groups=[
                  {key:"Wild Harvest",label:"Wild Harvest",icon:"🦌",match:i=>i.category==="Wild Harvest"},
                  {key:"Home Harvest",label:"Home Harvest",icon:"🌱",match:i=>i.category==="Home Harvest"},
                  {key:"Protein",label:"Protein Portions",icon:"🥩",match:i=>i.isBulkProtein&&i.category==="Protein"},
                  {key:"SauteBlend",label:"Sauté Blend",icon:"🫕",match:i=>i.vegType==="sauteBlend"},
                ];
                const allLabelable=inventory.filter(i=>groups.some(g=>g.match(i)));
                return(<>
                  <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                    <button onClick={()=>{const sel={};const qty={};allLabelable.forEach(i=>{sel[i.name]=true;qty[i.name]=Math.max(1,parseInt(i.qty)||1);});setLabelSelected(sel);setLabelQty(qty);}} style={{...bBtn("ghost"),fontSize:11,padding:"4px 10px"}}>Select All</button>
                    <button onClick={()=>{setLabelSelected({});setLabelQty({});}} style={{...bBtn("ghost"),fontSize:11,padding:"4px 10px"}}>Clear</button>
                  </div>
                  {allLabelable.length===0&&<div style={{fontSize:12,color:C.dim,padding:"10px 0"}}>Nothing label-ready yet — process a Repackage or Harvest batch first.</div>}
                  {groups.map(g=>{
                    const items=inventory.filter(g.match);
                    if(!items.length) return null;
                    return(
                      <div key={g.key} style={{marginBottom:12}}>
                        <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:6}}>{g.icon} {g.label.toUpperCase()}</div>
                        {items.map(item=>{
                          const key=item.name;
                          const checked=!!labelSelected[key];
                          const qty=labelQty[key]||Math.max(1,parseInt(item.qty)||1);
                          return(
                            <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",background:checked?"#1a2e1a":C.surface,border:"1px solid "+(checked?"#4c4":C.border),marginBottom:4}}>
                              <div onClick={()=>setLabelSelected(prev=>{const next=!prev[key];if(next)setLabelQty(q=>({...q,[key]:q[key]||Math.max(1,parseInt(item.qty)||1)}));return {...prev,[key]:next};})} style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}}>
                                <div style={{width:16,height:16,borderRadius:4,border:"2px solid "+(checked?"#4c4":C.muted),background:checked?"#4c4":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                  {checked&&<span style={{color:"#000",fontSize:10,fontWeight:900}}>✓</span>}
                                </div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{item.name}</div>
                                  <div style={{fontSize:11,color:C.muted}}>{item.qty} {item.unit}{item.harvestDate?" · Harvested "+item.harvestDate:""}{item.useBy?" · Best by "+item.useBy:""}</div>
                                </div>
                              </div>
                              {checked&&(
                                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                                  <button onClick={()=>setLabelQty(q=>({...q,[key]:Math.max(1,(q[key]||1)-1)}))} style={{...bBtn("ghost"),padding:"2px 8px",fontSize:13}}>−</button>
                                  <span style={{fontSize:13,fontWeight:700,color:"#4c4",minWidth:18,textAlign:"center"}}>{qty}</span>
                                  <button onClick={()=>setLabelQty(q=>({...q,[key]:(q[key]||1)+1}))} style={{...bBtn("ghost"),padding:"2px 8px",fontSize:13}}>+</button>
                                  <span style={{fontSize:10,color:C.dim}}>labels</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>);
              })()}
            </div>
            {/* Action buttons */}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",borderTop:"1px solid "+C.border,paddingTop:16}}>
              <button onClick={()=>setLabelModal(false)} style={{...bBtn("ghost"),padding:"10px 20px"}}>Cancel</button>
              <button disabled={Object.values(labelSelected).filter(Boolean).length===0} onClick={printLabels} style={{...bBtn("primary"),padding:"10px 24px",fontSize:14,opacity:Object.values(labelSelected).filter(Boolean).length===0?0.4:1}}>🖨 Print {(()=>{const tot=Object.keys(labelSelected).filter(k=>labelSelected[k]).reduce((sum,k)=>sum+Math.max(1,parseInt(labelQty[k])||1),0);return tot>0?tot+" Label"+(tot>1?"s":""):"Labels";})()}</button>
            </div>

          </div>
        </div>
      )}

      {/* == UPGRADE MODAL == */}
      {upgradeModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:16}} onClick={()=>setUpgradeModal(null)}>
          <div style={{background:C.card,border:"1px solid "+C.accent+"44",borderRadius:18,padding:28,maxWidth:420,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:12}}>{upgradeModal.icon}</div>
            <div style={{fontFamily:FD,fontSize:22,color:C.accent,marginBottom:8}}>{upgradeModal.feature}</div>
            <div style={{fontFamily:FM,fontSize:14,color:C.text,marginBottom:6,lineHeight:1.6}}>{upgradeModal.desc}</div>
            <div style={{background:C.surface,border:"1px solid "+C.accent+"33",borderRadius:10,padding:"12px 16px",margin:"16px 0",textAlign:"left"}}>
              <div style={{fontFamily:FM,fontSize:13,color:C.accent,fontWeight:700,marginBottom:4}}>30-Day Free Trial</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.text,lineHeight:1.6}}>Try everything free for 30 days. No credit card required. Solo starts at just <strong>$7.99/month</strong> after your trial.</div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{setUpgradeModal(null);onUpgrade();}} style={{...bBtn("primary"),padding:"12px 28px",fontSize:15,fontWeight:700}}>Start Free Trial</button>
              <button onClick={()=>setUpgradeModal(null)} style={{...bBtn("ghost"),padding:"12px 20px",fontSize:14}}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}
      {/* == EMAIL SENT MODAL == */}
      {emailSentModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:16}} onClick={()=>setEmailSentModal(null)}>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:28,maxWidth:400,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:40,marginBottom:12}}>📬</div>
            <div style={{fontFamily:FD,fontSize:20,color:C.accent,marginBottom:8}}>Shopping List Sent!</div>
            <div style={{fontFamily:FM,fontSize:14,color:C.text,marginBottom:6}}>Sent to <strong>{emailSentModal}</strong></div>
            <div style={{background:C.surface,border:"1px solid "+C.accent+"44",borderRadius:10,padding:"12px 16px",marginTop:16,marginBottom:20,textAlign:"left"}}>
              <div style={{fontFamily:FM,fontSize:12,fontWeight:700,color:C.accent,marginBottom:6}}>📁 Don't see it?</div>
              <div style={{fontFamily:FM,fontSize:13,color:C.text,lineHeight:1.6}}>Check your <strong>Spam</strong> or <strong>Junk</strong> folder. If it's there, mark it as <strong>"Not Spam"</strong> so future lists go straight to your inbox.</div>
            </div>
            <button onClick={()=>setEmailSentModal(null)} style={{...bBtn("primary"),padding:"10px 32px",fontSize:14}}>Got it!</button>
          </div>
        </div>
      )}
      {/* -- Guest Email Capture Banner -- */}
      {showGuestCapture&&!user&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1A2344",borderTop:"2px solid #C8963E",padding:"16px 20px",zIndex:800,display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,justifyContent:"center"}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#eceaf3",textAlign:"center",flexShrink:0}}>
          💛 <strong>Save your progress</strong> — get your free Smart Kitchen account
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input
            value={guestEmail}
            onChange={e=>setGuestEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submitGuestEmail()}
            placeholder="Your email address"
            type="email"
            style={{padding:"8px 14px",borderRadius:8,border:"1px solid #C8963E",background:"#0c0e14",color:"#eceaf3",fontSize:13,outline:"none",width:220}}
          />
          <button onClick={submitGuestEmail} style={{padding:"8px 16px",background:"#C8963E",border:"none",borderRadius:8,color:"#0c0e14",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            Save My Spot
          </button>
          <button onClick={()=>setShowGuestCapture(false)} style={{background:"transparent",border:"none",color:"#6b728e",cursor:"pointer",fontSize:18,padding:"0 4px"}}>✕</button>
        </div>
      </div>}

      {/* -- Support Chat Floating Button -- */}
      <button
        title="Chat with Smart Kitchen (drag to move)"
        onClick={e=>{if(!chatDragRef.current.moved) openChat();}}
        onMouseDown={e=>{
          const el=e.currentTarget;
          const rect=el.getBoundingClientRect();
          chatDragRef.current={dragging:true,moved:false,startX:e.clientX,startY:e.clientY,
            startPosX:chatBubblePos.x!==null?chatBubblePos.x:window.innerWidth-rect.width-16,
            startPosY:chatBubblePos.y!==null?chatBubblePos.y:window.innerHeight-rect.height-90};
          const onMove=mv=>{
            const dx=mv.clientX-chatDragRef.current.startX;
            const dy=mv.clientY-chatDragRef.current.startY;
            if(Math.abs(dx)>4||Math.abs(dy)>4) chatDragRef.current.moved=true;
            const nx=Math.max(8,Math.min(window.innerWidth-58,chatDragRef.current.startPosX+dx));
            const ny=Math.max(8,Math.min(window.innerHeight-58,chatDragRef.current.startPosY+dy));
            const pos={x:nx,y:ny};
            setChatBubblePos(pos);
            try{localStorage.setItem("sk_chatBubblePos",JSON.stringify(pos));}catch{}
          };
          const onUp=()=>{chatDragRef.current.dragging=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
          window.addEventListener("mousemove",onMove);
          window.addEventListener("mouseup",onUp);
        }}
        onTouchStart={e=>{
          const touch=e.touches[0];
          const el=e.currentTarget;
          const rect=el.getBoundingClientRect();
          chatDragRef.current={dragging:true,moved:false,startX:touch.clientX,startY:touch.clientY,
            startPosX:chatBubblePos.x!==null?chatBubblePos.x:window.innerWidth-rect.width-16,
            startPosY:chatBubblePos.y!==null?chatBubblePos.y:window.innerHeight-rect.height-90};
          const onMove=mv=>{
            const t=mv.touches[0];
            const dx=t.clientX-chatDragRef.current.startX;
            const dy=t.clientY-chatDragRef.current.startY;
            if(Math.abs(dx)>4||Math.abs(dy)>4){chatDragRef.current.moved=true;mv.preventDefault();}
            const nx=Math.max(8,Math.min(window.innerWidth-58,chatDragRef.current.startPosX+dx));
            const ny=Math.max(8,Math.min(window.innerHeight-58,chatDragRef.current.startPosY+dy));
            const pos={x:nx,y:ny};
            setChatBubblePos(pos);
            try{localStorage.setItem("sk_chatBubblePos",JSON.stringify(pos));}catch{}
          };
          const onEnd=()=>{chatDragRef.current.dragging=false;window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onEnd);};
          window.addEventListener("touchmove",onMove,{passive:false});
          window.addEventListener("touchend",onEnd);
        }}
        style={{
          position:"fixed",
          left:chatBubblePos.x!==null?chatBubblePos.x+"px":"auto",
          right:chatBubblePos.x!==null?"auto":"16px",
          top:chatBubblePos.y!==null?chatBubblePos.y+"px":"auto",
          bottom:chatBubblePos.y!==null?"auto":"90px",
          width:50,height:50,borderRadius:"50%",
          background:"#C8963E",border:"none",
          cursor:"grab",zIndex:900,
          boxShadow:"0 4px 20px rgba(200,150,62,0.5)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:22,touchAction:"none",userSelect:"none"
        }}>
        💬
      </button>

      {/* -- Support Chat Drawer -- */}
      {chatOpen&&<div style={{position:"fixed",bottom:0,right:0,width:"100%",maxWidth:420,height:"80vh",maxHeight:640,background:C.card,borderRadius:"20px 20px 0 0",boxShadow:"0 -8px 40px rgba(0,0,0,0.5)",zIndex:1000,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:"#1A2344",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>💬</span>
            <div>
              <div style={{fontFamily:FD,fontSize:18,color:"#C8963E",fontWeight:700}}>Smart Kitchen</div>
              <div style={{fontFamily:FM,fontSize:10,color:"#888888"}}>Always here for you</div>
            </div>
          </div>
          <button onClick={()=>setChatOpen(false)} style={{background:"transparent",border:"none",color:C.muted,fontSize:20,cursor:"pointer",padding:4}}>✕</button>
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px",display:"flex",flexDirection:"column",gap:12}}>
          {chatMessages.map(msg=>(
            <div key={msg.id} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"82%",background:msg.role==="user"?"#C8963E":C.surface,color:msg.role==="user"?"#0c0e14":C.text,borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontFamily:FM,fontSize:seniorMode?18:13,lineHeight:seniorMode?1.8:1.6,whiteSpace:"pre-wrap"}}
                dangerouslySetInnerHTML={{__html:msg.text.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>")}}
              />
            </div>
          ))}
          {chatLoading&&<div style={{display:"flex",justifyContent:"flex-start"}}>
            <div style={{background:C.surface,borderRadius:"16px 16px 16px 4px",padding:"10px 16px",fontFamily:FM,fontSize:seniorMode?17:13,color:C.muted}}>typing…</div>
          </div>}
          <div ref={chatEndRef}/>
        </div>
        {/* Quick Reply Buttons */}
        {proactiveQuickReplies.length>0&&<div style={{padding:"8px 16px 0",display:"flex",gap:8,flexWrap:"wrap",flexShrink:0}}>
          {proactiveQuickReplies.map((reply,i)=>(
            <button key={i} onClick={()=>{setProactiveQuickReplies([]);sendChatMessage(reply);}} style={{padding:"8px 14px",borderRadius:20,border:"1px solid #C8963E",background:"transparent",color:"#C8963E",fontFamily:FM,fontSize:seniorMode?16:12,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
              {reply}
            </button>
          ))}
        </div>}
        {/* Input */}
        <div style={{padding:"12px 16px",borderTop:"1px solid "+C.border,display:"flex",gap:8,flexShrink:0,background:C.card}}>
          <input
            value={chatInput}
            onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChatMessage();}}}
            placeholder="Type a message…"
            style={{flex:1,background:C.surface,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",color:C.text,fontFamily:FM,fontSize:seniorMode?17:13,outline:"none"}}
          />
          <button onClick={()=>{if(voiceState==="listening"){stopListening();}else{startListening();}}} title={"Voice input — Hey "+assistantName()} style={{background:voiceState==="listening"?"#ef4444":"transparent",border:"1px solid "+(voiceState==="listening"?"#ef4444":"#C8963E"),borderRadius:10,padding:"10px 12px",color:voiceState==="listening"?"#fff":"#C8963E",cursor:"pointer",fontSize:seniorMode?18:15,flexShrink:0}}>{voiceState==="listening"?"⏹":"🎙"}</button>
          <button onClick={()=>sendChatMessage()} disabled={chatLoading||!chatInput.trim()} style={{background:"#C8963E",border:"none",borderRadius:10,padding:"10px 16px",color:"#0c0e14",fontWeight:700,cursor:"pointer",fontFamily:FM,fontSize:seniorMode?17:13,opacity:chatLoading||!chatInput.trim()?0.5:1}}>
            Send
          </button>
        </div>
      </div>}

    {can.medicalCompliance&&(
      <button onClick={()=>setShowJournal(true)}
        style={{position:"fixed",bottom:seniorMode?100:80,right:16,zIndex:600,
        background:"#10b981",border:"none",borderRadius:"50%",
        width:seniorMode?64:52,height:seniorMode?64:52,
        boxShadow:"0 4px 16px rgba(16,185,129,0.4)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        cursor:"pointer",gap:1}}>
        <span style={{fontSize:seniorMode?22:18}}>📗</span>
        <span style={{fontFamily:FM,fontSize:8,color:"#fff",fontWeight:700,lineHeight:1}}>LOG</span>
      </button>
    )}
    {showJournal&&can.medicalCompliance&&(
      <FoodJournal
        user={user} supabase={supabase} familyProfiles={familyProfiles}
        can={can} seniorMode={seniorMode} C={C} FM={FM} FD={FD}
        journalMember={journalMember} setJournalMember={setJournalMember}
        journalMealType={journalMealType} setJournalMealType={setJournalMealType}
        journalFoodName={journalFoodName} setJournalFoodName={setJournalFoodName}
        journalWeight={journalWeight} setJournalWeight={setJournalWeight}
        journalWeightUnit={journalWeightUnit} setJournalWeightUnit={setJournalWeightUnit}
        journalDateTime={journalDateTime} setJournalDateTime={setJournalDateTime}
        journalNutrition={journalNutrition} setJournalNutrition={setJournalNutrition}
        journalCalcLoading={journalCalcLoading} setJournalCalcLoading={setJournalCalcLoading}
        journalSaving={journalSaving} setJournalSaving={setJournalSaving}
        journalSuccess={journalSuccess} setJournalSuccess={setJournalSuccess}
        journalRecentItems={journalRecentItems} setJournalRecentItems={setJournalRecentItems}
        logNutrition={logNutrition} callClaude={callClaude}
        onSaved={()=>setDashRefreshKey(k=>k+1)}
        onClose={()=>setShowJournal(false)}
      />
    )}
    {showEmailGate&&!user&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:20}}><div style={{background:C.card,borderRadius:18,padding:28,width:"100%",maxWidth:440,border:"2px solid #C8963E",boxShadow:"0 8px 40px rgba(0,0,0,0.6)"}}>{trialConfirmSent?(<div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📧</div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"#C8963E",marginBottom:12}}>Confirm your email</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:C.muted,lineHeight:1.7,marginBottom:20}}>We sent a confirmation link to<br/><strong style={{color:C.text}}>{trialEmail}</strong><br/>Click the link in that email to activate your account and get started.</div><div style={{background:C.surface,borderRadius:10,padding:"10px 14px",marginBottom:20,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",lineHeight:1.6}}>🔍 Didn’t receive it? Check your spam folder. Once confirmed, return here and sign in with your email and password.</div><button onClick={()=>{setTrialConfirmSent(false);setMagicLinkSent(false);setTrialEmail("");setTrialPassword("");setTrialEmailError("");}} style={{background:"transparent",border:"1px solid #555",borderRadius:10,padding:"10px 20px",color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",marginBottom:8}}>Use a different email</button><br/><button onClick={()=>{setShowEmailGate(false);setTrialConfirmSent(false);}} style={{background:"transparent",border:"none",color:"#666",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",marginTop:4}}>Back to sign in</button></div>):(<div><div style={{textAlign:"center",marginBottom:20}}><div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#C8963E",marginBottom:6}}>✨ Try Smart Kitchen Free</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,lineHeight:1.6}}>30 days of full access — no credit card required. Set your email and password to get started.</div></div><div style={{background:C.surface,borderRadius:10,padding:"10px 14px",marginBottom:16}}><div style={{display:"flex",flexWrap:"wrap",gap:"4px 16px"}}>{["✓ 7-day meal planning","✓ Smart Plate Mode","✓ Medical+ Intelligence","✓ Food Journal & Dashboard","✓ Voice assistant","✓ All features included"].map(f=>(<div key={f} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text}}>{f}</div>))}</div></div><div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:10}}><input value={trialEmail} onChange={e=>{setTrialEmail(e.target.value);setTrialEmailError("");}} placeholder="Email address" type="email" style={{width:"100%",background:C.surface,border:"1px solid "+(trialEmailError?"#dc2626":"#444"),borderRadius:10,padding:"12px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,boxSizing:"border-box"}}/><div style={{position:"relative"}}><input value={trialPassword} onChange={e=>setTrialPassword(e.target.value)} placeholder="Choose a password (min 6 characters)" type={showTrialPassword?"text":"password"} style={{width:"100%",background:C.surface,border:"1px solid #444",borderRadius:10,padding:"12px 48px 12px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,boxSizing:"border-box"}}/><button type="button" onClick={()=>setShowTrialPassword(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:12,padding:"4px 6px",userSelect:"none"}}>{showTrialPassword?"Hide":"Show"}</button></div></div>{trialEmailError&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#dc2626",marginBottom:8}}>{trialEmailError}</div>}<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#666",lineHeight:1.6,marginBottom:14,padding:"8px 12px",background:"#ffffff08",borderRadius:8,border:"1px solid #333"}}>🔒 <strong style={{color:"#888"}}>Privacy:</strong> Your email will only be used for necessary communications between RG Digital Labs, LLC / Smart Kitchen and you. We will never sell, share, or distribute your email address to third parties.</div><button onClick={async()=>{const email=trialEmail.trim();const pass=trialPassword;if(!email||!email.includes("@")||!email.includes(".")){setTrialEmailError("Please enter a valid email address.");return;}if(pass.length<6){setTrialEmailError("Password must be at least 6 characters.");return;}setTrialEmailSubmitting(true);setTrialEmailError("");try{const {data,error}=await supabase.auth.signUp({email,password:pass,options:{emailRedirectTo:"https://smart-kitchen-opal.vercel.app",data:{trial:true,trial_source:"30day_trial",trial_start:new Date().toISOString()}}});if(error){setTrialEmailError(error.message);setTrialEmailSubmitting(false);return;}await fetch("/api/mailchimp-subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,name:"Trial User",tags:["30-day-trial"]})}).catch(()=>{});try{localStorage.setItem("sk_guestTrialEmail",email);localStorage.setItem("sk_trialStart",Date.now().toString());}catch{}setTrialConfirmSent(true);}catch(e){setTrialEmailError("Something went wrong — please try again.");}setTrialEmailSubmitting(false);}} disabled={trialEmailSubmitting} style={{width:"100%",background:"#C8963E",border:"none",borderRadius:12,padding:"14px",color:"#000",fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,cursor:trialEmailSubmitting?"default":"pointer",marginBottom:10,opacity:trialEmailSubmitting?0.6:1}}>{trialEmailSubmitting?"⏳ Creating your account...":"✨ Create My Free Account"}</button><button onClick={()=>{setShowEmailGate(false);setTrialEmail("");setTrialPassword("");setTrialEmailError("");}} style={{width:"100%",background:"transparent",border:"none",color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",padding:4}}>← Back — sign in to existing account</button></div>)}</div></div>)}    </div>
  );
}



// force redeploy Tue May 12 20:19:28 UTC 2026

// deploy trigger 2026-05-31
