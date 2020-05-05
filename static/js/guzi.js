// var guzi = guzi || { version: "0.1" };
function transaction(id1, id2, signerId) {
    if (typeof transaction.counter == 'undefined' ) {
        transaction.counter = 0;
    }
    transaction.counter += 1;
    return transaction.counter + ":"+id1+"=>"+id2+":"+signerId;
}

class User {
    tx = [];
    id = null;

    constructor(id) {
        this.id = id;
    }

    transactions(n=0) {
        if (n > 0) {
            return this.tx.slice(-1*n);
        }
        return this.tx;
    }

    add(tx) {
        if (typeof tx == "string") {
            tx = [tx];
        }
        tx.forEach((t) => {
            if (! this.tx.includes(t)) {
                this.tx.push(t);
            }
        });
    }

    /*
     * Cheating means "removing last transaction in which user is involved"
     */
    cheat() {
        for (let i = 1; i < this.tx.length; i++) {
            if (this.isInvolvedIn(this.tx.slice(-i)[0])) {
                this.tx.splice(-i, 1);
            }
        }
    }

    isInvolvedIn(tx) {
        return tx.split(":")[1].includes(this.id);
    }

    /*
     * Return true if given user seems clean
     * Return false if given user misses at least one transaction he or she
     * should have.
     */
    control(user) {
        return this.tx.every((tx) => {
            if (! user.isInvolvedIn(tx)) {
                return true;
            }
            return user.transactions().includes(tx);
        });
    }

}





//guzi.Simulator = {
//    /*
//     * Initialize a fabric canvas in element with given id
//     */
//    initCanvas: function(canvasId) {
//        var c = document.getElementById(canvasId);
//        c.width = window.innerWidth;
//        var canvas = this.__canvas = new fabric.Canvas('canvas', {
//            renderOnAddRemove: false,
//            selection: false
//        });
//
//        var total = 10,
//            blobs = new Array(total),
//            maxx = canvas.width,
//            maxy = canvas.height,
//            ballsRadius = 20,
//            tx_index = 0,
//            request;
//    },
//};
