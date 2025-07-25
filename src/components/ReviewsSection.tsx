
export function ReviewsSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">What Our Customers Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="beauty-card p-6">
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < testimonial.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">Verified Purchase</span>
              </div>
              
              <blockquote className="text-gray-700 mb-4">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="flex items-center">
                {testimonial.avatar && (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full mr-3 object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: "Sarah Johnson",
    location: "New York, NY",
    rating: 5,
    quote: "I can't believe I didn't discover BeautyHub sooner! The range of products is amazing, and the delivery was super fast. I've already placed my second order!",
    avatar: "https://randomuser.me/api/portraits/women/11.jpg"
  },
  {
    name: "Michael Chen",
    location: "Los Angeles, CA",
    rating: 5,
    quote: "Ordered skincare products for my wife and she absolutely loved them. Great selection from multiple brands all in one place. Will definitely shop here again!",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg"
  },
  {
    name: "Emily Rodriguez",
    location: "Chicago, IL",
    rating: 4,
    quote: "The rewards program is amazing, and I love being able to shop from different beauty stores all in one checkout. The product recommendations are spot on!",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg"
  }
];
