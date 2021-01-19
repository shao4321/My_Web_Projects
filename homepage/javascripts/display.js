indexForm = document.getElementById("indexForm");
hobbyForm = document.getElementById("hobbyForm");
famForm = document.getElementById("famForm");
occForm = document.getElementById("occForm");

// Function for changing select box color
selectBtn = document.getElementsByTagName("select")[0];

let changeSelectBoxBG = () => {
  if (selectBtn.value == "yes") selectBtn.style.backgroundColor = "green";
  if (selectBtn.value == "no") selectBtn.style.backgroundColor = "red";
};

if (selectBtn) selectBtn.addEventListener("change", changeSelectBoxBG);

// Function for pending status
let pendings = document.getElementsByClassName("pending");
pendings = Array.prototype.slice.call(pendings);
let cnt = 0;
let endPending = false;

let pendingStatus = () => {
  pendings.forEach((pending) => {
    if (cnt > 3) {
      pending.textContent = "Pending";
    } else {
      pending.textContent += ".";
    }
  });
  if (cnt > 3) cnt = 0;
  cnt++;
};

let runPendingStatus = setInterval(pendingStatus, 2000);

function displayInfos(e) {
  e.preventDefault();
  let name = document.querySelector("#name").value;
  let nationality = document.querySelector("#nationality").value;
  let age = document.querySelector("#age").value;
  let bday = document.querySelector("#bday").value;
  var content = document.getElementsByTagName("aside")[0];

  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();

  if (dd < 10) dd = "0" + dd;

  if (mm < 10) mm = "0" + mm;
  var date = yyyy + "-" + mm + "-" + dd;

  document.querySelector("#resultName").innerHTML = "Hi " + name + " !";
  document.querySelector("#resultNatAge").innerHTML =
    "Coming from " + nationality + "," + " you are " + age + " years old.";
  document.querySelector("#resultBday").innerHTML =
    "Your birthday falls on " + bday + " and today's date is " + date + ".";

  alert("You have submitted 'Basic Introduction' form, " + name);
  content.className = "active";
}

function displayHobby(e) {
  e.preventDefault();
  let enjoy = document.querySelector("#enjoy").value;
  let sport = document.querySelector("#sport").value;
  let x = document.getElementById("choice").selectedIndex;
  let col_HEX = document.getElementById("color").value;
  document.querySelector("#resultEnjoy").innerHTML = enjoy;
  document.querySelector("#resultSport").innerHTML = sport;

  if (document.getElementsByTagName("option")[x].value == "yes") {
    document.querySelector("#resultPool1").innerHTML =
      "I like to play pool too! Let's play together someday!";
    document.querySelector("#resultPool2").innerHTML = "You like pool!";
  } else {
    document.querySelector("#resultPool1").innerHTML =
      "Pool is fun, too bad that you don't like it";
    document.querySelector("#resultPool2").innerHTML = "You dislike pool!";
  }
  document.querySelector("#resultColor1").innerHTML = "HEX(" + col_HEX + ")";
  function hexToRGBA(hex, opacity) {
    return (
      "RGBA(" +
      (hex = hex.replace("#", ""))
        .match(new RegExp("(.{" + hex.length / 3 + "})", "g"))
        .map(function (l) {
          return parseInt(hex.length % 2 ? l + l : l, 16);
        })
        .concat(opacity || 1)
        .join(",") +
      ")"
    );
  }
  let RGBA = hexToRGBA(col_HEX);
  document.querySelector("#resultColor2").innerHTML = RGBA;
  alert("You have submitted 'Your Hobbies' form");

  clearInterval(runPendingStatus);
}

function displayAgeDiff(e) {
  e.preventDefault();
  let GD_age = document.querySelector("#GD_age").value;
  let GM_age = document.querySelector("#GM_age").value;
  let dad_age = document.querySelector("#dad_age").value;
  let mum_age = document.querySelector("#mum_age").value;
  let my_age = document.querySelector("#my_age").value;

  let age_diff_GD = GD_age - my_age;
  let age_diff_GM = GM_age - my_age;
  let age_diff_dad_age = dad_age - my_age;
  let age_diff_mum_age = mum_age - my_age;

  let gdContent = document.querySelector("#GD_diff");
  let gmContent = document.querySelector("#GM_diff");
  let dadContent = document.querySelector("#dad_diff");
  let mumContent = document.querySelector("#mum_diff");
  let myContent = document.querySelector("#my_diff");

  gdContent.innerHTML = gmContent.innerHTML = dadContent.innerHTML = mumContent.innerHTML = myContent.innerHTML =
    "";

  if (my_age > 0) {
    if (GD_age < 0 || GD_age < my_age) {
      gdContent.innerHTML = "Invalid age input for your Grandfather!";
    } else {
      gdContent.innerHTML =
        "Your grandfather is " + age_diff_GD + " years older than you.";
    }
    if (GM_age < 0 || GM_age < my_age) {
      gmContent.innerHTML = "Invalid age input for your Grandmother!";
    } else {
      gmContent.innerHTML =
        "Your grandmother is " + age_diff_GM + " years older than you.";
    }
    if (dad_age < 0 || dad_age < my_age) {
      dadContent.innerHTML = "Invalid age input for your Dad!";
    } else {
      dadContent.innerHTML =
        "Your dad is " + age_diff_dad_age + " years older than you.";
    }
    if (mum_age < 0 || mum_age < my_age) {
      mumContent.innerHTML = "Invalid age input for your Mum!";
    } else {
      mumContent.innerHTML =
        "Your mum is " + age_diff_mum_age + " years older than you.";
    }
  } else {
    myContent.innerHTML = "Invalid age input for your own age!";
  }

  alert("You have submitted 'Family Members' form");
  var content = document.getElementsByTagName("aside")[0];
  content.className = "active";
}

function displayEmpStatus(e) {
  e.preventDefault();
  let empSelOptIdx = document.getElementById("emp_status").selectedIndex;
  let empOptions = document.getElementById("emp_status").options;
  let empResult = document.getElementById("empResult");
  let content = document.getElementsByTagName("aside")[0];

  empResult.innerHTML = "";
  content.classList.remove("active");

  if (empOptions[empSelOptIdx].value == "self_emp") {
    empResult.innerHTML =
      "A person is self-employed if they run their own business for themselves and " +
      "are solely responsible for its success. They are not protected by the employment rights enjoyed by employees," +
      "simply because they don’t have an ‘employer’ in the same way.<br/>" +
      "You can usually tell that someone is self-employed if:<br/>" +
      "- They don’t get holiday or sick pay when they’re not working.<br/>" +
      "- They give out ‘quotes’ for their work.<br/>" +
      "- They submit invoices once their work is done.<br/>";
  } else if (empOptions[empSelOptIdx].value == "emp") {
    empResult.innerHTML =
      "The ‘employee’ employment type covers anyone working under a contract of employment.<br/>" +
      "Employees enjoy all the protections of a ‘worker’, " +
      "but with a range of additional employment rights and protections.<br/>" +
      "A person is generally understood to be an employee if they:<br/>" +
      "- Have a contract of employment (that doesn’t necessarily need to be a written contract, though – sometimes, a verbal contract is enough).<br/>" +
      "- Are generally required to work regularly unless they are on some form of leave – for example, sick leave or parental leave.<br/>" +
      "- Receive paid holiday.<br/>" +
      "- Are subject to redundancy procedures.<br/>" +
      "- They are also usually required to work a minimum amount of hours, and they can’t subcontract someone else to do their work for them.<br/>";
  } else if (empOptions[empSelOptIdx].value == "wker") {
    empResult.innerHTML =
      "The ‘worker’ status is the most casual of the three different types of employment status.<br/>" +
      "A person is generally defined as a ‘worker’ if:<br/>" +
      "- They have an arrangement to perform work or services.<br/>" +
      "- They have to turn up for work even if they don’t want to.<br/>" +
      "- They cannot subcontract their work out to other people.<br/>" +
      "- They aren’t doing the work as a limited company (that would make them self-employed).<br/>";
  } else {
    empResult.innerHTML =
      "Unemployment occurs when a person who is actively searching for employment is unable to find work.<br/>" +
      "Unemployment is often used as a measure of the health of the economy.<br/>" +
      "The most frequent measure of unemployment is the unemployment rate," +
      "which is the number of unemployed people divided by the number of people in the labor force.<br/>";
  }
  content.className = "active";
}

if (indexForm) indexForm.addEventListener("submit", displayInfos);
if (hobbyForm) hobbyForm.addEventListener("submit", displayHobby);
if (famForm) famForm.addEventListener("submit", displayAgeDiff);
if (occForm) occForm.addEventListener("submit", displayEmpStatus);
