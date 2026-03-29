import { Link } from "react-router-dom"

function ItemCard({ item }) {
  const { id, title, description, location, date, image, type } = item

  return (
    <div className="item-card">
      <div className="item-card-img-wrap">
        {image
          ? <img src={image} alt={title} className="item-card-img" />
          : <div className="item-card-img-placeholder">{type === "lost" ? "🔴" : "🟢"}</div>
        }
        <div className="item-card-badge-wrap">
          <span className={`badge badge-${type}`}>
            {type === "lost" ? "● Lost" : "● Found"}
          </span>
        </div>
      </div>

      <div className="item-card-body">
        <div className="item-card-title">{title}</div>
        {description && <p className="item-card-desc">{description}</p>}
        <div className="item-card-meta">
          {location && <span>📍 {location}</span>}
          {date && <span>📅 {date}</span>}
        </div>
      </div>

      <div className="item-card-footer">
        <Link to={`/item/${id}`}>
          <button className="btn btn-outline btn-sm" style={{ width: "100%" }}>
            View Details →
          </button>
        </Link>
      </div>
    </div>
  )
}

export default ItemCard
