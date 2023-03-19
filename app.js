
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

//integrating socket.io
const { Server } = require("socket.io");
const io = new Server(server);
const session = require("express-session");
/*
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
socket.on('disconnect', () => {
        console.log('user disconnected');
});
});

server.listen(3000, () => {
 console.log('listening on *:3000');
});*/

const availableMeals= {
    1: "Oha soup and pounded yam",
    2: "White rice and stew",
    3: "spaghetti and chicken",
    4: "Jollof and grilled chicken",
    5: "Ewa Agoyin and bread",
};

const orderHistory = [];

const sessionMiddleware = session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
});

app.use(express.static("public"));
app.use(sessionMiddleware);

app.get("/", async (req, res) => {
    try {
    res.sendFile(__dirname + "/index.html");
    } catch (err) {
    console.log(err);
    res.status(500).send("Error serving restaurant.html");
    }
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const state = {
    userName: "",
    currentOrder: [],
    };

    const botMessage = async (message) => {
    console.log("Bot message received:", message);
    socket.emit("bot-message", message);
    };

    const userMessage = async (message) => {
    console.log("User message received:", message);

    try {
        if (!state.userName) {
          // Welcome
        state.userName = message;
        await botMessage(
            `Welcome to Caren Restaurant ChatBot, ${state.userName} Please place your order\n1. Checkout Order\n99. Order History\n98. Current Order\n97. Cancel Order\n0.`
        );
        } else {
        switch (message) {
            case "1":
              // list of items 
            const itemOptions = Object.keys(availableMeals)
                .map((key) => `${key}. ${availableMeals[key]}`)
                .join("\n");
            await botMessage(
                `List of available dishes:\n ${itemOptions} .\nPlease select one by typing its number.`
            );
            break;
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
              // Parse the number from the user input and add the corresponding item to the current order
            const selectedIndex = parseInt(message);
            if (availableMeals.hasOwnProperty(selectedIndex)) {
                const selectedItem = availableMeals[selectedIndex];
                state.currentOrder.push(selectedItem);
                await botMessage(
                `${selectedItem} has been added to your cart. Do you want to add more dishes to your order? Type number appropriate number. If not, type 99 to checkout.`
                );
            } else {
                await botMessage("Please type te correct number.");
            }
            break;
            case "99":
            if (state.currentOrder.length === 0) {
                await botMessage(
                "No order to place. Place an order\n1. Check the menu"
                );
            } else {
                orderHistory.push(state.currentOrder);
                await botMessage("Order placed");
                state.currentOrder = [];
            }
            break;
            case "98":
            if (orderHistory.length === 0) {
                await botMessage("No previous orders");
            } else {
                const orderHistoryString = orderHistory
                .map(
                    (order, index) => `Order ${index + 1}. ${order.join(", ")}`
                )
                .join("\n");
                await botMessage(
                `Previous orders:\n${orderHistoryString}`
                );
            }
            break;
            case "97":
            if (state.currentOrder.length === 0) {
                await botMessage("No current order");
            } else {
                const currentOrderString = state.currentOrder.join(", ");
                await botMessage(
                `Here is your current order:\n${currentOrderString}`
                );
            }
            break;
            case "0":
            if (state.currentOrder.length === 0) {
                await botMessage("No order to cancel");
            } else {
                state.currentOrder = [];
                await botMessage("Order canceled");
            }
            break;
            default:
            await botMessage("Invalid input");
        }
        }
    } catch (err) {
        console.log(err);
        await botMessage("An error occurred while processing your request.");
    }
    };

    socket.on("user-message", userMessage);

    socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});