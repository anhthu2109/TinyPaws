import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import slide0 from '../../assets/slider/sl0.png';
import slide1 from '../../assets/slider/sl1.jpg';
import slide2 from '../../assets/slider/sl2.png';
import slide3 from '../../assets/slider/sl3.png';

import { Navigation, Pagination, Autoplay } from 'swiper/modules';

const HomeSlider = () => {
    return (
        <div className="homeSlider py-4 relative z-10">
            <div className="container">
                <Swiper
                    spaceBetween={10}
                    navigation={true}
                    pagination={{
                        clickable: true,
                        dynamicBullets: true,
                    }}
                    autoplay={{
                        delay: 2000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }}
                    loop={true}
                    modules={[Navigation, Pagination, Autoplay]}
                    className="sliderHome"
                >
                    <SwiperSlide>
                        <div className="item rounded-[20px] overflow-hidden h-[260px] md:h-[360px] lg:h-[420px]">
                            <img src={slide0} alt="Banner slide" className="w-full h-full object-cover" />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="item rounded-[20px] overflow-hidden h-[260px] md:h-[360px] lg:h-[420px]">
                            <img src={slide3} alt="Banner slide" className="w-full h-full object-cover" />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="item rounded-[20px] overflow-hidden h-[260px] md:h-[360px] lg:h-[420px]">
                            <img src={slide2} alt="Banner slide" className="w-full h-full object-cover" />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className="item rounded-[20px] overflow-hidden h-[260px] md:h-[360px] lg:h-[420px]">
                            <img src={slide1} alt="Banner slide" className="w-full h-full object-cover" />
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>
        </div>
    )
}

export default HomeSlider;
