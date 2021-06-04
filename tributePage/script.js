const timelines = document.getElementById("timeline");

const getTimelines = async function () {
  const response = await fetch("timeline.json");
  if (!response.ok) throw new Error("Cannot fetch data");
  const data = await response.json();
  return data;
};

getTimelines()
  .then((datas) => {
    for (let data of datas) {
      const li = document.createElement("li");
      li.innerHTML = `<b>${data.year}</b> - ${data.content}`;
      timelines.appendChild(li);
    }
  })
  .catch((error) => console.log("Rejected: ", error.message));
