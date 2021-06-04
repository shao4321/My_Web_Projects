let start = 1;
let image_num = 0;

let setNewImage = (changeImgWay) => {
  setInterval(changeImgWay, 2000);
};

let changeImgHelper = (image_num) => {
  var image_data = `../imgs/${image_num}.jpg`;
  if (start > 2) start = 0;
  var image = document.getElementById("data");
  image.src = image_data;
  start++;
};

function indexImageShow() {
  image_num = start + 0;
  changeImgHelper(image_num);
}

function hobbyImageShow() {
  image_num = start + 3;
  changeImgHelper(image_num);
}

function famImageShow() {
  image_num = start + 6;
  changeImgHelper(image_num);
}

function occImageShow() {
  image_num = start + 9;
  changeImgHelper(image_num);
}
