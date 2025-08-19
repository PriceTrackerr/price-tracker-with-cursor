"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: require('path').resolve(__dirname, '../../.env') });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataPath = path_1.default.join(__dirname, '../../data/data.json');
async function updateNotificationsUserId() {
    try {
        const data = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
        console.log('Updating notifications user ID...');
        console.log('Current user ID in notifications:', data.notifications[0]?.userId);
        const currentUserId = '1753818521609lw3h2';
        data.notifications.forEach((notification, index) => {
            notification.userId = currentUserId;
            console.log(`Updated notification ${index + 1}: ${notification.productTitle}`);
        });
        fs_1.default.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log(`\n✅ Updated ${data.notifications.length} notifications to use user ID: ${currentUserId}`);
        console.log('Notifications should now appear for the current user.');
    }
    catch (error) {
        console.error('Error updating notifications:', error);
    }
}
updateNotificationsUserId();
//# sourceMappingURL=updateNotificationsUserId.js.map