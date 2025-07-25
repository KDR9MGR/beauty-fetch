export var Constants = {
    public: {
        Enums: {
            order_status: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            product_status: ["active", "inactive", "out_of_stock"],
            store_status: ["active", "inactive", "pending"],
            user_role: ["customer", "store_owner", "admin", "driver"],
        },
    },
};
