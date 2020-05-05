describe('transaction', () => {
    it('should return a transaction.', () => {
        const tx = transaction("AAA", "BBB", "BBB");

        chai.assert.equal(tx, "1:AAA=>BBB:BBB");
    });

    it('should return a different id on each call.', () => {
        const tx1 = transaction("AAA", "BBB", "BBB");
        const tx2 = transaction("AAA", "BBB", "BBB");
        const tx3 = transaction("AAA", "BBB", "BBB");

        chai.assert.notEqual(tx1, tx2);
        chai.assert.notEqual(tx2, tx3);
        chai.assert.notEqual(tx3, tx1);
    });
});


describe('User', () => {
    describe('constructor', () => {
        it('should set the user id.', () => {
            const user = new User("myId");

            chai.assert.equal(user.id, "myId");
        });

        it('should initialize transactions array to empty array.', () => {
            const user = new User();

            chai.assert.equal(user.transactions().length, 0);
        });
    });

    describe('add', () => {
        it('should add the given transaction to transactions pool.', () => {
            const user = new User("AAA");

            user.add("111:AAA=>BBB:BBB");

            chai.assert.equal(user.transactions().length, 1);
        });

        it('should add the given transaction list to transactions pool.', () => {
            const user = new User("AAA");

            user.add(["111:AAA=>BBB:BBB", "222:AAA=>BBB:AAA"]);

            chai.assert.equal(user.transactions().length, 2);
        });

        it('should not add transaction already in.', () => {
            const user = new User("AAA");

            user.add("111:AAA=>BBB:BBB");
            user.add("111:AAA=>BBB:BBB");
            user.add("111:AAA=>BBB:BBB");

            chai.assert.equal(user.transactions().length, 1);
        });
    });

    describe('transactions', () => {
        const user = new User("AAA");

        user.add("111:AAA=>BBB:BBB");
        user.add("222:AAA=>BBB:BBB");
        user.add("333:AAA=>BBB:BBB");
        user.add("444:AAA=>BBB:BBB");
        user.add("555:AAA=>BBB:BBB");

        it('should return all transactions if no argument given.', () => {
            chai.assert.equal(user.transactions().length, 5);
        });

        it('should return last N transactions if N given.', () => {
            transactions = user.transactions(3);
            chai.assert.equal(transactions[0], "333:AAA=>BBB:BBB");
            chai.assert.equal(transactions[1], "444:AAA=>BBB:BBB");
            chai.assert.equal(transactions[2], "555:AAA=>BBB:BBB");
        });
    });

    describe('cheat', () => {
        it('should remove last transaction.', () => {
            const user = new User("AAA");

            user.add("111:AAA=>BBB:BBB");
            user.add("222:AAA=>BBB:BBB");
            user.add("333:AAA=>BBB:BBB");
            user.cheat();

            chai.assert.equal(user.transactions().length, 2);
        });

        it('should remove last transaction involving user.', () => {
            const user = new User("AAA");

            user.add("111:AAA=>BBB:BBB");
            user.add("222:AAA=>BBB:BBB");
            user.add("333:AAA=>BBB:BBB");
            user.add("444:DDD=>CCC:BBB");
            user.add("555:CCC=>BBB:BBB");
            user.cheat();

            const transactions = user.transactions();
            chai.assert.equal(transactions[0], "111:AAA=>BBB:BBB");
            chai.assert.equal(transactions[1], "222:AAA=>BBB:BBB");
            chai.assert.equal(transactions[2], "444:DDD=>CCC:BBB");
            chai.assert.equal(transactions[3], "555:CCC=>BBB:BBB");
        });
    });

    describe('isInvolvedIn', () => {
        it('should return true if user is involved in given transaction.', () => {
            const user = new User("AAA");
            const tx = "111:AAA=>BBB:BBB";

            chai.expect(user.isInvolvedIn(tx)).to.be.true;
        });

        it('should return false if user is not involved in given transaction.', () => {
            const user = new User("AAA");
            const tx = "111:CCC=>BBB:BBB";

            chai.expect(user.isInvolvedIn(tx)).to.be.false;
        });
    });

    describe('control', () => {
        it('should return true if controlled user is clean.', () => {
            const controller = new User("AAA");
            const controlled = new User("BBB");
            const tx1 = transaction(controller.id, controlled.id, controller.id);
            const tx2 = transaction("CCC", "DDD", "DDD");
            const tx3 = transaction("AAA", "BBB", "AAA");

            controller.add([tx1, tx2, tx3]);
            controlled.add([tx1, tx2, tx3]);

            chai.expect(controller.control(controlled)).to.be.true;
        });

        it('should only check transactions controlled user is involved in.', () => {
            const controller = new User("AAA");
            const controlled = new User("BBB");
            const tx1 = transaction(controller.id, controlled.id, controller.id);
            const tx2 = transaction("CCC", "DDD", "DDD");
            const tx3 = transaction("AAA", "DDD", "AAA");
            const tx4 = transaction("AAA", "BBB", "AAA");

            controller.add([tx1, tx2, tx3, tx4]);
            controlled.add([tx1, tx4]);

            chai.expect(controller.control(controlled)).to.be.true;
        });

        it('should return false if controlled user is missing a transaction he did.', () => {
            const controller = new User("AAA");
            const controlled = new User("BBB");
            const tx1 = transaction(controller.id, controlled.id, controller.id);
            const tx2 = transaction("CCC", "DDD", "DDD");
            const tx3 = transaction("AAA", "BBB", "AAA");

            controller.add([tx1, tx2, tx3]);
            controlled.add([tx2, tx3]);

            chai.expect(controller.control(controlled)).to.be.false;
        });
    });
});
