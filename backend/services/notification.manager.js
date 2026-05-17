export class NotificationManager {
    constructor() {
        this.strategies = []; 
    }

    // Tiêm (Inject) thêm kênh thông báo mới
    use(strategy) {
        this.strategies.push(strategy);
    }

    // Bắn thông báo qua tất cả các kênh
    async notifyAll(user, workshopData) {
        const promises = this.strategies.map(strategy => strategy.send(user, workshopData));
        await Promise.allSettled(promises);
    }
}