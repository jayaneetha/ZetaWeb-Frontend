var jquery = require("jquery");
window.$ = window.jQuery = jquery;

// Import all plugins

// Or import only needed plugins
// import { Tooltip as Tooltip, Toast as Toast, Popover as Popover } from 'bootstrap';
// Or import just one
// import Alert as Alert from '../node_modules/bootstrap/js/dist/alert';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const BACKEND_URL = "http://127.0.0.1:8000"

const emotion_map = {
  'hap': 'Happy 😊',
  'sad': "Sad 😞️",
  'ang': 'Angry 😡',
  'neu': "Neutral 😐"
}

$(document).ready(function () {
  // Create root and chart
  let root = am5.Root.new("chartdiv");

  let feedback_submissions = 0;

  $('#btnUpload').click(function (e) {
    const form = new FormData(document.querySelector('#frmFileUpload'))

    const settings = {
      "url": BACKEND_URL + "/uploadfile",
      "method": "POST",
      "timeout": 0,
      "processData": false,
      "mimeType": "multipart/form-data",
      "contentType": false,
      "data": form
    };

    $.ajax(settings).done(function (response) {
      const res = $.parseJSON(response)
      sessionStorage.setItem('audio_id', res['audio_id']);
      $("#spanRLEmotion").html(emotion_map[res['rl_emotion']]);
      $("#spanSLEmotion").html(emotion_map[res['sl_emotion']]);

      $('.record-audio').removeClass('visible').addClass('hidden');
      $('.inference-results').removeClass('hidden').addClass('visible');
    });


    $('.btnRL').removeClass('disabled');
    $('.btnSL').removeClass('disabled');
    feedback_submissions = 0

  });

  $('.btnFeedback').click(function (event) {
    const model = $(event.target).data('model');
    const feedback = $(event.target).data('feedback');
    const audioId = sessionStorage.getItem('audio_id')

    $('.btn' + model).addClass('disabled');

    submitFeedback(audioId, model, feedback, () => {
      if (feedback_submissions > 0) {
        $('.inference-results').removeClass('visible').addClass('hidden');
        $('.record-audio').removeClass('hidden').addClass('visible');
      }
    });
  });

  function submitFeedback(audioId, model, feedback, callback) {
    const settings = {
      "url": BACKEND_URL + "/feedback?audio_id=" + audioId + "&feedback=" + feedback + "&model=" + model,
      "method": "POST",
      "timeout": 0,
      "headers": {
        "Accept": "application/json"
      },
    };

    $.ajax(settings).done(function (r) {
      callback();
      $('#frmFileUpload').trigger('reset');
      loadPerformance();
      feedback_submissions = feedback_submissions + 1;
    });
  }

  function loadPerformance() {

    root.container.children.clear();

    const settings = {
      "url": BACKEND_URL + "/performance",
      "method": "GET",
      "timeout": 0,
      "headers": {
        "Accept": "application/json"
      },
    };

    $.ajax(settings).done(function (r) {

      root.setThemes([am5themes_Animated.new(root)]);

      var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panY: false, wheelY: "zoomX", layout: root.verticalLayout
      }));

      // Define data
      var data = r;


      // Craete Y-axis
      let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      }));

      // Create X-Axis
      var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.2, renderer: am5xy.AxisRendererX.new(root, {}), categoryField: "episode"
      }));
      xAxis.data.setAll(data);

      // Create series
      var series1 = chart.series.push(am5xy.LineSeries.new(root, {
        name: "RL Model",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "rl",
        categoryXField: "episode",
        tooltip: am5.Tooltip.new(root, {})
      }));
      series1.data.setAll(data);

      var series2 = chart.series.push(am5xy.LineSeries.new(root, {
        name: "SL Model", xAxis: xAxis, yAxis: yAxis, valueYField: "sl", categoryXField: "episode"
      }));
      series2.data.setAll(data);

      // Add legend
      var legend = chart.children.push(am5.Legend.new(root, {}));
      legend.data.setAll(chart.series.values);
    });

  }


})
