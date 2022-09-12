// Import jQuery
var jquery = require("jquery");
window.$ = window.jQuery = jquery;

// Import Bootstrap
import * as bootstrap from 'bootstrap';

// initialize boostrap tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

// Import amCharts
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
      "url": BACKEND_URL + "/performance?limit=20",
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
      r.sort((a, b) => {
        return a['episode'] - b['episode']
      });
      console.log(r)
      // const res = $.parseJSON(r)
      // console.log(res);
      // var data = res['accuracies'];
      const data = r;

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
        stroke: am5.color('#0D84A5'),
        name: "RL Model",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "rl_accuracy",
        categoryXField: "episode",
        tooltip: am5.Tooltip.new(root, {})
      }));
      series1.data.setAll(data);

      series1.strokes.template.setAll({
        strokeWidth: 2
      });

      var series2 = chart.series.push(am5xy.LineSeries.new(root, {
        stroke: am5.color('#FEA056'),
        name: "SL Model",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "sl_accuracy",
        categoryXField: "episode"
      }));
      series2.data.setAll(data);

      series2.strokes.template.setAll({
        strokeWidth: 2
      });


      // Add legend
      var legend = chart.children.push(am5.Legend.new(root, {}));
      legend.data.setAll(chart.series.values);
    });

  }


})
