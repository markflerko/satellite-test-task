// получаем доспут к контейнерам
let container = document.querySelector('#container');
let canvas = document.querySelector('#canvas');
let canvasContainer = document.querySelector('#canvasContainer');

// Вспомогательные функции для создания дом-элементов
function addFigure({ type, left, top }) {
  let figure = document.createElement('div')
  figure.className = `hero ${type} draggable`;
  figure.style.top = top
  figure.style.left = left
  figure.style.position = 'absolute'
  figure.style.zIndex = 1
  canvasContainer.append(figure)
}

function addCircle() {
  let circle = document.createElement('div');
  circle.className = 'hero circle draggable';
  container.append(circle);
}

function addSquare() {
  let square = document.createElement('div');
  square.className = 'hero square draggable';
  container.append(square);
}

// получаем массив данных с положением элементов на canvasContainer
// из localStorage
let elementsLocation = localStorage.getItem('elementsLocation')

if (elementsLocation) {
  elementsLocation = JSON.parse(elementsLocation);
} else {
  elementsLocation = []
}

let isDragging = false;

// добавляем элементы из хранилища на канвас
function mappingStoredElement(elementsLocation) {
  elementsLocation.forEach((el) => {
    addFigure(el);
  })
}

mappingStoredElement(elementsLocation)

document.addEventListener('mousedown', function (event) {

  let dragElement = event.target.closest('.draggable');

  if (!dragElement) return;

  event.preventDefault();

  dragElement.ondragstart = function () {
    return false;
  };

  let shiftX, shiftY;

  // выделение элемента при клике
  if (event.target.className.match('.draggable')) {
    Array.from(canvasContainer.children).forEach(el => el.classList.remove('chosen'))
    event.target.classList.add('chosen');
  }

  startDrag(dragElement, event.clientX, event.clientY);

  function onMouseUp(event) {
    finishDrag(event);
  };

  function onMouseMove(event) {
    moveAt(event.clientX, event.clientY);
  }

  //   в начале перемещения элемента:
  //   запоминаем место клика по элементу (shiftX, shiftY),
  //   переключаем позиционирование элемента (position:fixed) и двигаем элемент
  function startDrag(element, clientX, clientY) {
    if (isDragging) {
      return;
    }

    isDragging = true;

    document.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseup', onMouseUp);

    shiftX = clientX - element.getBoundingClientRect().left;
    shiftY = clientY - element.getBoundingClientRect().top;

    element.style.zIndex = 1;
    element.style.position = 'fixed';

    if (clientX < container.getBoundingClientRect().right) {
      element.classList.contains('circle') ? addCircle() : addSquare()
    }

    moveAt(clientX, clientY);
  };

  // переключаемся обратно на абсолютные координаты
  // чтобы закрепить элемент относительно документа
  function finishDrag(event) {
    if (!isDragging) {
      return;
    }

    isDragging = false;

    if (event.clientX < canvasContainer.getBoundingClientRect().x || event.clientY < canvasContainer.getBoundingClientRect().y) {
      dragElement.remove();
    } else {
      dragElement.style.top = parseInt(dragElement.style.top) + pageYOffset + 'px';
      dragElement.style.position = 'absolute';
      canvasContainer.append(dragElement);
    }

    document.removeEventListener('mousemove', onMouseMove);
    dragElement.removeEventListener('mouseup', onMouseUp);

  }

  function moveAt(clientX, clientY) {
    // вычисляем новые координаты (относительно окна)
    let newX = clientX - shiftX;
    let newY = clientY - shiftY;
    {
      // проверяем, не переходят ли новые координаты за нижний край окна:
      // сначала вычисляем гипотетический новый нижний край окна
      let newBottom = newY + dragElement.offsetHeight;

      // затем, если новый край окна выходит за пределы документа, прокручиваем страницу
      if (newBottom > document.documentElement.clientHeight) {
        // координата нижнего края документа относительно окна
        let docBottom = document.documentElement.getBoundingClientRect().bottom;

        // простой скролл документа на 10px вниз имеет проблему -
        // он может прокручивать документ за его пределы,
        // поэтому используем Math.min(расстояние до конца, 10)
        let scrollY = Math.min(docBottom - newBottom, 10);

        // вычисления могут быть не совсем точны - случаются ошибки при округлении,
        // которые приводят к отрицательному значению прокрутки. отфильтруем их:
        if (scrollY < 0) scrollY = 0;

        window.scrollBy(0, scrollY);

        // быстрое перемещение мыши может поместить курсор за пределы документа вниз
        // если это произошло -
        // ограничиваем новое значение Y максимально возможным исходя из размера документа:
        newY = Math.min(newY, document.documentElement.clientHeight - dragElement.offsetHeight);
      }

      // проверяем, не переходят ли новые координаты за верхний край окна (по схожему алгоритму)
      if (newY < 0) {
        // прокручиваем окно вверх
        let scrollY = Math.min(-newY, 10);
        if (scrollY < 0) scrollY = 0; // проверяем ошибки точности

        window.scrollBy(0, -scrollY);
        // быстрое перемещение мыши может поместить курсор за пределы документа вверх
        newY = Math.max(newY, 0); // newY не может быть меньше нуля
      }

      // окончательно устанавливаем координаты
      // (в т.ч. чтобы не фигура не выходила за канвас, курсор всё ещё в канвасе)
      newY = clientY > canvas.clientHeight ? Math.max(newY, canvas.clientHeight) : Math.max(newY, 0)

      // ограничим newX размерами окна
      // согласно условию, горизонтальная прокрутка отсутствует, поэтому это не сложно:
      if (newX < 0) newX = 0;
      if (newX > document.documentElement.clientWidth - dragElement.offsetWidth) {
        newX = document.documentElement.clientWidth - dragElement.offsetWidth;
      }

      // окончательно устанавливаем координаты
      // (в т.ч. чтобы не фигура не выходила за канвас, курсор всё ещё в канвасе)
      newX = clientX > container.clientWidth ? Math.max(newX, container.clientWidth) : Math.max(newX, 0)

    }
    dragElement.style.left = newX + 'px';
    dragElement.style.top = newY + 'px';
  }

});

// удаляем выделенный элемент
document.querySelector('#delete').addEventListener('click', () => {
  Array.from(canvasContainer.children).forEach((el) => {
    if (el.className.match('.chosen')) {
      el.remove();
      return;
    }
  })
})

// подготовка данных для добавления в localStorage
function getElementParams(element) {
  let { top, left } = element.style;
  let type = element.classList.contains('circle') ? 'circle' : 'square'
  return { top, left, type }
}

// сохранение положения элементов перед закрытием страницы
function beforeUnloadHandler() {
  elementsLocation = [];

  Array.from(canvasContainer.children).forEach((i) => {
    elementsLocation.push(getElementParams(i))
  })

  localStorage.setItem('elementsLocation', JSON.stringify(elementsLocation));
}

window.onbeforeunload = beforeUnloadHandler;

let importInput = document.querySelector('#import');

importInput.onchange = function () {
  canvasContainer.innerHTML = '';

  let file = importInput.files[0];

  let reader = new FileReader();

  reader.readAsText(file);

  reader.onload = function () {
    mappingStoredElement(JSON.parse(reader.result))
  };
}

let exportLink = document.getElementById("export");

function download(text) {
  let file = new Blob([text], { type: "application/json" });
  exportLink.href = URL.createObjectURL(file);
  exportLink.download = 'dogecoin.json';
}

exportLink.onclick = () => {
  let arr = [];

  Array.from(canvasContainer.children).forEach((i) => {
    arr.push(getElementParams(i))
  })

  download(JSON.stringify(arr))
}

