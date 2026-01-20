import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from 'fs'
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
    adapter,
});

async function main() {

    // ====================================================
    // 1. (Categories) 
    // ====================================================
    try {
        const categoriesPath = path.join(__dirname, 'categories.json');

        const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

        console.log('--- Seeding Categories ---');

        for (const category of categories) {

            const existing = await prisma.category.findFirst({
                where: { slug: category.slug }
            });

            if (!existing) {
                await prisma.category.create({
                    data: category
                });
                console.log(`Created category: ${category.name}`);
            } else {
                console.log(`Skipping existing category: ${category.name}`);
            }
        }
    } catch (error) {
        console.error("Error seeding categories (maybe file not found?):", error);
    }

    // ====================================================
    // 1. (Products) 
    // ====================================================



    const productsPath = path.join(__dirname, 'products.json')
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'))

    console.log('--- Seeding Products ---');

    for (const product of products) {
        const existing = await prisma.product.findFirst({
            where: { name: product.name }
        })

        if (!existing) {
            const p = await prisma.product.create({
                data: product
            })
            console.log(`Created product with id: ${p.id}`)
        } else {
            console.log(`Skipping existing product: ${product.name}`)
        }
    }


    console.log(`Seeding finished.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })