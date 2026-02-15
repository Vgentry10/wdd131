document.addEventListener('DOMContentLoaded', () => {
  //forEach
  const steps = ['one', 'two', 'three'];

  //steps.forEach(function(item) {
  //  console.log(item);
  //});

  steps.forEach(showSteps);

  function showSteps(item) {
    console.log(item);
  };

  //.map

  let myList = document.querySelector('#myList');

  const stepsHtml = steps.map(listTemplate);

  function listTemplate(item) {
    return `<li>${item}</li>`; 
  };

  myList.innerHTML = stepsHtml.join('');

  let grades = ['A', 'B', 'C', 'D', 'F'];
  let points;

  let gpaPoints = grades.map(convert);


  function convert(grade) {
      switch (grade){
          case 'A':
              points = 4;
              break;
          case 'B':
              points = 3;
              break;
          case 'C':
              points = 2;
              break;
          case 'D':
              points = 1;
              break;
          case 'F':
              points = 0;
              break;
          default:
              alert('not a valid grade');
      }
      return points;
  }

  console.log(gpaPoints);

  //.reduce

  let totalPoints = gpaPoints.reduce(getTotal);

  function getTotal(total, item) {
      return total + item;
  }

  console.log(totalPoints);

  let gpaAverage = totalPoints / gpaPoints.length;

  console.log(gpaAverage);

  //.filter

  const words = ['watermelon', 'peach', 'apple', 'tomato', 'grape'];
            
  const shortWords = words.filter(function(word) {
      return word.length < 6;
  });

  console.log(shortWords);

  //.indexOf

  const myArray = [12, 34, 56, 78, 90];
  const luckyNumber = 56;
  let luckyIndex = myArray.indexOf(luckyNumber);

  console.log(luckyIndex);

  //dynamic content

  let container = document.querySelector('#studentContainer');

  const students = [
        {last: 'Andrus', first: 'Aaron'},
        {last: 'Masa', first:'Manny'},
        {last: 'Tanda', first: 'Tamanda'}
    ];

  students.forEach(function(item) {
      let name = document.createElement('div');
      name.className = 'format';

      let html = `
          <span>${item.first}</span>
          <span>${item.last}</span>
          <hr>
      `;

      name.innerHTML = html;
      container.appendChild(name);
  });
});