var gpio = require("gpio"),
    morse = require("morse");

var message = "SOS SOS",
    // в пакете morse похоже ошибка, меняем на правильную паузу между словами (*, который будет обработан далее)
    messageMorse = morse.encode(message).replace(" ....... ", "*"), // ... --- ...
    messagePosition = 0,
    inProgress = false, // от "двойного" нажатия
    gpioConfig = {
      led: 1,   // светодиод на gpio1
      button: 0 // кнопка на gpio0
    },
    morseDotDur = 100, // длительность точки
    morseConfig = {
      dot: morseDotDur,       // точка
      dash: morseDotDur * 3,  // тире
      // пауза между сигналами (элементами одного знака), в скрипте вставляется после "." и "-"
      pause: morseDotDur,
      space: morseDotDur * 3 - morseDotDur, // пауза между знаками в слове (вычет одной паузы, так как одна пауза уже есть после "." или "-")
      spaceWord: morseDotDur * 7 - morseDotDur // пауза между словами
    }
    ;

// console.log(messageMorse);

// светодиод
var gpioLed = gpio.export(gpioConfig.led, {
   direction: 'out',
   ready: function() { gpioLed.set(0); }
});

// кнопка
var gpioButton = gpio.export(gpioConfig.button, {
   direction: 'in',
   interval: 50 // интервал опроса порта в мс
});

// при смене статуса - подача SOS
gpioButton.on("change", function(val) {
  if(inProgress) return;
  if(val == 0) blinkMessage();
});

function blinkMessage() {
  inProgress = true;
  blink(messageMorse[messagePosition], function(){
    messagePosition++;
    if(messagePosition >= messageMorse.length) {
      messagePosition = 0;
      inProgress = false;
      return; // конец сообщения
    }
    blinkMessage();
  });

}

// если нет кнопки
// setTimeout(function(){ blinkMessage(); }, 1000);

// signal: ".", "-", " ", "*"
function blink(signal, callback) {
  console.log(signal);
  switch(signal) {
    case ".":
      blinkSignal(morseConfig.dot, callback);
      break;
    case "-":
      blinkSignal(morseConfig.dash, callback);
      break;
    case " ":
      blinkSpace(morseConfig.space, callback);
      break;
    case "*":
      blinkSpace(morseConfig.spaceWord, callback);
      break;
    default:
      // нет такой буквы!
      process.exit(1);
      break;
  }


}

function blinkSignal(duration, callback) {
  gpioLed.set(1); // зажигаем
  setTimeout(function(){
    gpioLed.set(0); // ждем duration и выключаем
    setTimeout(function(){ callback() }, morseConfig.pause); // выдерживаем паузу и возвращаем управление
  }, duration);
}

function blinkSpace(duration, callback) {
  gpioLed.set(0); // выключаем (на всякий случай)
  setTimeout(function(){ callback() }, duration); // выдерживаем паузу и возвращаем управление
}
