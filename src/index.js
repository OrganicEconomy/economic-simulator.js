const Matter = require('matter-js')
// TODO: TOUT PASSER EN ZOULIES CLASSES
const SIMULATION_BACK_COLOR = 'transaparent'; //"#bcaa99";
const SIMULATION_BORDERS_COLOR = "#4d8b31";
const SIMULATION_BALLS_COLOR = "#4d8b31";
const SIMULATION_BANKS_COLOR = "#666666";
const SIMULATION_MIN_SIZE = 6;
const COLUMNS = 8;
const ROWS = 5;
const MAX_RECRUITS_PER_COMPANIES = 7;

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Body = Matter.Body,
    Events = Matter.Events,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Common = Matter.Common,
    World = Matter.World,
    Bodies = Matter.Bodies;

function getRandomColor () {
    var letters = '0123456789ABCDEF';
    var res = '#';
    for (var i = 0; i < 6; i++) {
        res += letters[Math.floor(Math.random() * 16)];
    }
    return res;
}

class Wallet {
	constructor(walletOwner, baseCash=0) {
		this.owner = walletOwner;
		this.cash = baseCash;
	}

	getCashAmount() {
		return this.cash;
	}

	destroyMoney(amount) {
		if (this.canAffordIt(amount)) {
			this.cash -= amount;
		}
	}

    pay(target, amount) {
        if (!this.canAffordIt(amount)) {
            return 0;
        }
        this.cash -= amount;
		console.log(target)
        target.income(amount);
        this.updateSize(-amount);
        return amount;
    }

    income(amount) {
        this.cash += amount;
        this.updateSize(amount);
    }

    canAffordIt(amount) {
        return this.cash >= amount;
    }

    getSizingRatio(amount) {
		let ratio = (1.2 * (this.cash) + SIMULATION_MIN_SIZE) / (1.2 * (this.cash - amount) + SIMULATION_MIN_SIZE)
		return ratio;
    }

	updateSize(amount) {
		let ratio = this.getSizingRatio(amount);
		this.owner.updateSize(ratio)
	}
}

class HumanResourcesHandler {
	constructor (people) {
		this.availablePeople = people.slice();
		this.busyPeople = [];
	}

	getRecruit() {
		if (this.availablePeople.length === 0) {
			return null;
		}
		const recruit = this.availablePeople.pop();
		// recruit.render.fillStyle = color;
		this.busyPeople.push(recruit);

		return recruit;
	}

	freeRecruit(recruit) {
		const index = this.busyPeople.indexOf(recruit);
		if (index > -1) { // only splice array when item is found
			this.busyPeople.splice(index, 1);
			this.availablePeople.unshift(recruit);
			// recruit.render.fillStyle = SIMULATION_BALLS_COLOR;
		}
	}
}

class AdminService {
	constructor(company, aHumanResourcesHandler, maxEmployees=MAX_RECRUITS_PER_COMPANIES) {
		this.company = company;
		this.humanResourcesHandler = aHumanResourcesHandler;
		this.employees = [];
		this.maxEmployees = maxEmployees;
	}

    payEmployees(salary) {
        var paid,
            toFire = 0;
        for (var i = 0; i < this.employees.length; i++) {
            paid = this.company.wallet.pay(this.employees[i], salary);
			//TODO updateSizes();
            if (paid === 0) {
                toFire += 1;
            } else {
                // console.log("paid the", i);
            }
        }
        for (var i = 0; i < toFire; i++) {
            this.fireAnEmployee();
        }
        if (this.company.wallet.canAffordIt(salary + (2 * this.employees.length)) && this.employees.length < this.maxEmployees) {
            const recruit = this.recruitAnEmployee();
        }
    }

    recruitAnEmployee() {
        const recruit = this.humanResourcesHandler.getRecruit();
        if (recruit) {
            this.employees.push(recruit);
        }
        return recruit;
    }

    fireAnEmployee() {
        this.humanResourcesHandler.freeRecruit(this.employees.pop());
    }
}

class Person {
	constructor (matterShape) {
		this.shape = matterShape;
		this.wallet = new Wallet(this)
	}

	updateSize(ratio) {
        Matter.Body.scale(this.shape, ratio, ratio);
	}

	income() {
	}
}

class Simulation {
	constructor(elementId) {
		this.lastTime = Common.now();

		this.elementId = elementId
		this.started = false;
		this.paused = true;
		this.speeds = [];
		this.CtoCTransactionAmount = 1;
		this.humanResourcesHandler = null;
		this.counter = 0;

		// create an engine
		this.engine = Engine.create();
		this.engine.gravity.scale = 0;
		this.world = this.engine.world;

		// create a renderer
		var element = document.getElementById(this.elementId);
		this.renderer = Render.create({
			element,
			engine: this.engine,
			options: {
				wireframes: false,
				background: SIMULATION_BACK_COLOR,
			}
		});

		let render = this.renderer;
		let engine = this.engine;
		var handleWindowResize = function() {
			// get the current window size
			var width = element.clientWidth,
				height = element.clientHeight;
			console.log(element, width, height);

			render.canvas.style.width = `${width}px`;
			render.canvas.style.height = `${width*2/3}px`;
		};

		handleWindowResize();

		window.addEventListener('resize', handleWindowResize);
	}

    render() {
        Render.run(this.renderer);
        return this;
    }
    
    run() {
        this.runner = this.runner || Runner.create();
        Runner.run(this.runner, this.engine);
    }

    init() {
        this.render();
        this.run();
        Render.stop(this.renderer);
        Runner.stop(this.runner);
        return this;
    }

    start() {
        if (! this.started) {
            this.shakeScene();
            this.started = true;
        }
		if (this.paused) {
			this.paused = false;
			this.logTotalCashInSimulation();
			this.render();
			this.run();
		}
    }

    stop() {
        if (! this.started) {
            return;
        }
        Render.stop(this.renderer);
        Runner.stop(this.runner);
		this.paused = true;
    }

	logTotalCashInSimulation() {
        console.group("counting cash");
		console.log(this.people.length, "people")
		var result = 0;
		for (var i = 0; i < this.people.length; i++) {
			result += this.people[i].wallet.getCashAmount();
		}
		if (this.companies) {
			console.log(this.companies.length, "companies")
			for (var i = 0; i < this.companies.length; i++) {
				result += this.companies[i].wallet.getCashAmount();
			}
		}
		console.log(result, "€ total");
        console.groupEnd();
		return result;
	}

    /*
     * Initilize the borders and add them to scene
     **/
    addBorders() {
        var bodyStyle = { fillStyle: SIMULATION_BORDERS_COLOR };

        Composite.add(this.world, [
            Bodies.rectangle(400, 0, 800, 10, { isStatic: true, render: bodyStyle }),
            Bodies.rectangle(400, 600, 800, 10, { isStatic: true, render: bodyStyle }),
            Bodies.rectangle(800, 300, 10, 600, { isStatic: true, render: bodyStyle }),
            Bodies.rectangle(0, 300, 10, 600, { isStatic: true, render: bodyStyle })
        ]);
        return this;
    }

    /**
     * Add a split bar in the middle of the scene, to have half balls on one
     * side and the over half on the other side
     */
    addSplit() {
        var bodyStyle = { fillStyle: SIMULATION_BORDERS_COLOR };

        Composite.add(this.world, [
            Bodies.rectangle(400, 300, 20, 600, { isStatic: true, render: bodyStyle }),
        ]);
        return this;
    }

	/***********************************************************************
	 *                               PEOPLE
	 **********************************************************************/

    /* 
     * Initialize the balls and add them to scene
     **/
    addPeople() {
        const peopleStack = Composites.stack(70, 100, COLUMNS, ROWS, 50, 50, function(x, y) {
            return Bodies.circle(x, y, SIMULATION_MIN_SIZE/2, { restitution: 1, render: { fillStyle: SIMULATION_BALLS_COLOR }});
        });

        Composite.add(this.world, peopleStack);
        for (var i = 0; i < peopleStack.length; i++) {
            this.people.push(new Person(peopleStack[i]));
        }
		this.humanResourcesHandler = new HumanResourcesHandler(this.people)

        return this;
    }

    /**
     * Set the peoples capital.
     * If random is true, randomness is based on given capital
     */
    setPeopleCapital(capital, random=false) {
        var calculatedCapital = function() { return capital; }
        if (random) {
            calculatedCapital = function() { return Math.round(Common.random() * capital); }
        }

        var ratio, capital;
        for (var i = 0; i < this.people.length; i++) {
			capital = calculatedCapital();
            this.people[i].wallet.income(capital);
        }

        return this;
    }

    /**
     * Set the peoples color (I bet a lot will ask for white oO).
     * If color is null, colors are random
     */
    setPeopleColor(color=null) {
        var getColor = function() { return color; };

        if (!color) { getColor = getRandomColor }

        for (var i = 0; i < this.people.length; i++) {
            this.people[i].render.fillStyle = getColor();
        }

        return this;
    }

    /**
     * Set the peoples speed.
     * If random is true, speed is the base for randomness
     */
    setPeopleSpeed(speed, random=false) {
        for (var i = 0; i < this.people.length; i++) {
            this.people[i].customSpeed = speed;
            if (random) {
                this.people[i].customSpeed = Common.random() * speed;
            }
        }

        var engine = this.engine;
        var people = this.people;

        Events.on(this.engine, 'beforeUpdate', function(event) {
            for (var i = 0; i < people.length; i++) {
                Body.setSpeed(people[i], people[i].customSpeed);
            }
        });
        return this;
    }

    shakeScene() {
        var bodies = Composite.allBodies(this.engine.world);

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var forceMagnitude = 0.03 * body.mass;

            // apply the force over a single update
            Body.applyForce(body, body.position, { 
                x: (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]), 
                y: -forceMagnitude + Common.random() * -forceMagnitude
            });
        }
    };

    /*
     * On each collision, make a transaction from people (circle) to people (circle)
     */
    setPeopleTransactionsOn(ctocAmount) {
        Events.on(this.engine, 'collisionStart', function(event) {
            var pairs = event.pairs;

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];

                if (pair.bodyA.label === "Circle Body" && pair.bodyB.label === "Circle Body") {
                    var A = Common.choose([pair.bodyA, pair.bodyB]);
                    var B = A === pair.bodyA ? pair.bodyB : pair.bodyA;
                    A.wallet.pay(B, ctocAmount);
                }
            }
        });
        return this;
    }

	/***********************************************************************
	 *                             COMPANIES
	 **********************************************************************/

    /**
     * Add squares representing companies
     */
    addCompanies(n) {
        const companyStack = Composites.stack(500, 100, 2, Math.round(n/2), 50, 50, function(x, y) {
            return Bodies.rectangle(x, y, 15, 15, { restitution: 1, render: { fillStyle: getRandomColor() }});
        });
        Composite.add(this.world, companyStack);
        this.companies = companyStack.bodies;

        for (var i = 0; i < this.companies.length; i++) {
            this.companies[i].adminService = new AdminService(this.companies[i], this.humanResourcesHandler);
            this.companies[i].wallet = new Wallet(this.companies[i]);
        }
        return this;
    }

    /**
     * Set the companies capital.
     * If random is true, randomness is based on given capital
     */
    setCompaniesCapital(capital, random=false) {
        var calculatedCapital = function() { return capital; }
        if (random) {
            calculatedCapital = function() { return Math.round(Common.random() * capital); }
        }

        var ratio;
        for (var i = 0; i < this.companies.length; i++) {
            this.companies[i].wallet.income(calculatedCapital());
        }

        return this;
    }

    /*
     * On each collision, make a transaction from customer (circle) to company (rectangle)
     */
    setCompaniesTransactionOn(btobAmount, ctobAmount) {
        Events.on(this.engine, 'collisionStart', function(event) {
            var pairs = event.pairs;

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];

                var A = pair.bodyA,
                    B = pair.bodyB;

				if (! A.isStatic && ! B.isStatic) {
					if (A.label === "Rectangle Body" && B.label === "Circle Body") {
						B.wallet.pay(A, ctobAmount);
					} else if (A.label === "Circle Body" && B.label === "Rectangle Body") {
						A.wallet.pay(B, ctobAmount);
					} else if (A.label === "Rectangle Body" && B.label === "Rectangle Body") {
						var A2 = Common.choose([A, B]);
						var B2 = A2 === A ? B : A;
						A2.wallet.pay(B2, btobAmount);
					}
				}
            }
        });
        return this;
    }

    /**
     * On update, pay salaries
     */
    setCompaniesSalariesOn(salary) {
        var companies = this.companies;
		var simulation = this;
		var lastTime = this.lastTime;

        Events.on(this.engine, 'beforeUpdate', function(event) {
            if (Common.now() - lastTime >= 5000) {
				simulation.logTotalCashInSimulation();
                for (var i = 0; i < companies.length; i++) {
                    companies[i].adminService.payEmployees(salary);
                }
                // update last time
                lastTime = Common.now();
            }
        });

        return this;
    }

    setCompaniesSpeed(speed, random=false) {
        for (var i = 0; i < this.companies.length; i++) {
            this.companies[i].customSpeed = speed;
            if (random) {
                this.companies[i].customSpeed = Common.random() * speed;
            }
        }

        var engine = this.engine;
        var companies = this.companies;

        Events.on(this.engine, 'beforeUpdate', function(event) {
            for (var i = 0; i < companies.length; i++) {
                Body.setSpeed(companies[i], companies[i].customSpeed);
            }
        });
        return this;
    }

	/***********************************************************************
	 *                                BANKS
	 **********************************************************************/
    /**
     * Add triangles representing companies
     */
    addBanks(n) {
        const bankStack = Composites.stack(500, 200, 2, Math.round(n/2), 50, 50, function(x, y) {
            return Bodies.polygon(x, y, 3, 15, { restitution: 1, render: { fillStyle: SIMULATION_BANKS_COLOR }});
        });
        Composite.add(this.world, bankStack);
        this.banks = bankStack.bodies;

        for (var i = 0; i < this.banks.length; i++) {
            this.banks[i].wallet = new Wallet(this.banks[i]);
        }
        return this;
    }

	/**
	 * Set the probability to make a loan at the bank
	 */
	setBanksLoanOn(odds) {
		let counter = this.counter;
		const engine = this.engine;
        Events.on(engine, 'collisionStart', function(event) {
            var pairs = event.pairs;
			let lastSecond = Common.now();

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];

                var A = pair.bodyA,
                    B = pair.bodyB;

				if (A.label === "Polygon Body" || B.label === "Polygon Body") {
					counter += 1;
				}

				if (! A.isStatic && ! B.isStatic && (A.label === "Polygon Body" || B.label === "Polygon Body") && counter >= odds) {
					const bank = A.label === "Polygon Body" ? A : B;
					const target = A.label === "Polygon Body" ? B : A;
					if (target.loan && target.loan > 0) {
						return;
					}
					counter = 0;
					target.wallet.income(10);
					target.loan = 11;
					console.log(bank.label, "making loan to", target.label)

					Events.on(engine, 'beforeUpdate', function(event) {
						if (Common.now() - lastSecond >= 2000) {
							if (target.loan > 0) {
								if (target.loan === 11) {
									target.wallet.pay(bank, 1);
								}
								target.loan -= 1;
								target.wallet.destroyMoney(1);
							}
							// update last second
							lastSecond = Common.now();
						}
					});
				}
            }
        });
        return this;
	}

	setBanksColor(color=null) {
        var getColor = function() { return color; };

        if (!color) { getColor = getRandomColor }

        for (var i = 0; i < this.banks.length; i++) {
            this.banks[i].render.fillStyle = getColor();
        }

        return this;
	}

	setBanksSpeed(speed, random=false) {
        for (var i = 0; i < this.banks.length; i++) {
            this.banks[i].customSpeed = speed;
            if (random) {
                this.banks[i].customSpeed = Common.random() * speed;
            }
        }

        var engine = this.engine;
        var banks = this.banks;

        Events.on(this.engine, 'beforeUpdate', function(event) {
            for (var i = 0; i < banks.length; i++) {
                Body.setSpeed(banks[i], banks[i].customSpeed);
            }
        });
        return this;
	}

	setBanksCapital(capital, random=false) {
        var calculatedCapital = function() { return capital; }
        if (random) {
            calculatedCapital = function() { return Math.round(Common.random() * capital); }
        }

        var ratio;
        for (var i = 0; i < this.banks.length; i++) {
            this.banks[i].adminService = new AdminService(this.banks[i], this.humanResourcesHandler);
            this.banks[i].wallet.income(calculatedCapital());
        }

		return this;
	}

    /**
     * On update, pay salaries
     */
    setBanksSalariesOn(salary) {
        var banks = this.banks;
		var simulation = this;

        Events.on(this.engine, 'beforeUpdate', function(event) {
            if (Common.now() - lastTime >= 5000) {
                for (var i = 0; i < banks.length; i++) {
                    banks[i].adminService.payEmployees(salary);
                }
                // update last time
                lastTime = Common.now();
            }
        });

        return this;
    }
}

class SimulationHandler {
	constructor() {
		this.simulations = [];
	}

    add(name, simulation) {
        this.bindSimulationToButtons(simulation, name);
        this.simulations.push(simulation);
    }

    bindSimulationToButtons(simulation, name) {
        var simulations = this.simulations;
        let startButton = document.getElementById(`${name}Start`);
		startButton.addEventListener('click', function (event) {
            for (var i = 0; i < simulations.length; i++) {
                if (simulations[i] !== simulation) {
                    simulations[i].stop();
                }
            }
            simulation.start();
        });

        let pauseButton = document.getElementById(`${name}Pause`);
		pauseButton.addEventListener('click', function (event) {
			event.preventDefault()
			simulation.stop();
		});
    }
}

module.exports = { Person, Wallet, HumanResourcesHandler, AdminService, Simulation, SimulationHandler }
