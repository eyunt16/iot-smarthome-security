/**
 * recharts-shim.js
 *
 * Recharts publishes proper named ESM exports.
 * Import and re-export them directly — no `.default` unwrapping needed.
 * This file exists so all chart components across the app have a single
 * import source that can be swapped out if the library ever changes.
 */
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  RadialBarChart,
  RadialBar,
  ReferenceLine,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export {
  Area,
  AreaChart,
  BarChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  RadialBarChart,
  RadialBar,
  ReferenceLine,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
};
