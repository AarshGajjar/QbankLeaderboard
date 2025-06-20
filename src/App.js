import { jsx as _jsx } from "react/jsx-runtime";
import QBankTracker from './components/QBankTracker';
import DashboardLayout from './components/functionality/DashboardLayout';
function App() {
    return (_jsx(DashboardLayout, { children: _jsx("div", { className: "lg:col-span-12", children: _jsx(QBankTracker, {}) }) }));
}
export default App;
