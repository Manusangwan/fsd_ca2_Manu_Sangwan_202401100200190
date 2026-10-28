
import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import Book from "./bookSchema.js"

dotenv.config()

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000

mongoose.connect(process.env.MONGOOSE_URI)
    .then(() => {
        console.log("MongoDB connected successfully")
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message)
        process.exit(1)
    })

app.post("/api/books", async (req, res) => {
    try {
        const { title, author, category } = req.body

        if (!title || !author || !category) {
            return res.status(400).json({
                message: "title, author and category are required"
            })
        }

        const book = await Book.create({
            title,
            author,
            category
        })

        return res.status(201).json({
            message: "Book created successfully",
            book
        })
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
})

app.get("/api/books", async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) ||  1)
        const limit = Math.max(parseInt(req.query.limit, 10) || 10)

        const [books, total] = await Promise.all([
            Book.find()
                .skip((page - 1) * limit)
                .limit(limit),
            Book.countDocuments()
        ])

        return res.status(200).json({
            books,
            total,
            page,
            pages: Math.ceil(total / limit)
        })
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
})

app.patch("/api/books/:id", async (req, res) => {
    try {
        const { id } = req.params
        const { isAvailable } = req.body

        if (typeof isAvailable !== "boolean") {
            return res.status(400).json({
                message: "isAvailable must be a boolean"
            })
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid book ID"
            })
        }

        const updatedBook = await Book.findByIdAndUpdate(
            id,
            { isAvailable },
            { new: true, runValidators: true }
        )

        if (!updatedBook) {
            return res.status(404).json({
                message: "Book not found"
            })
        }

        return res.status(200).json({
            message: "Availability updated successfully",
            book: updatedBook
        })
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
})

app.listen(PORT, () => {
            console.log(`Server is listening at ${PORT}...`)
        })