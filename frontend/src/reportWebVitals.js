/**
 * @file reportWebVitals.js
 * @description A utility function to measure and log web vital metrics in the application. This can be used for performance analysis and optimization.
 */

/**
 * Measures and reports web vitals metrics if a valid callback function is provided.
 *
 * @param {Function} onPerfEntry - Callback function to handle the performance entries.
 * The function is called with metric results for each of the web vitals.
 *
 * @example
 * // Log performance metrics to the console
 * import reportWebVitals from './reportWebVitals';
 * reportWebVitals(console.log);
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Dynamically import the web-vitals library and fetch metrics
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry); // Cumulative Layout Shift
      getFID(onPerfEntry); // First Input Delay
      getFCP(onPerfEntry); // First Contentful Paint
      getLCP(onPerfEntry); // Largest Contentful Paint
      getTTFB(onPerfEntry); // Time to First Byte
    });
  }
};

export default reportWebVitals;
