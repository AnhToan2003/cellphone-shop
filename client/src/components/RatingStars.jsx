import PropTypes from "prop-types";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

const RatingStars = ({ rating, size = 16 }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1 text-brand-primary">
      {Array.from({ length: 5 }).map((_, index) => {
        if (index < fullStars) {
          return <AiFillStar key={index} size={size} />;
        }
        if (hasHalf && index === fullStars) {
          return (
            <AiFillStar
              key={index}
              size={size}
              className="text-brand-light"
            />
          );
        }
        return (
          <AiOutlineStar key={index} size={size} className="text-brand-light" />
        );
      })}
    </div>
  );
};

RatingStars.propTypes = {
  rating: PropTypes.number.isRequired,
  size: PropTypes.number,
};

export default RatingStars;
