import {article} from './article'
import {author} from './author'
import {category} from './category'
import {experience} from './experience'
import {hotel} from './hotel'
import {mediaImage} from './objects/media'
import {localizedSlug, localizedString, localizedText} from './objects/localized'
import {pullQuote} from './objects/body'
import {seo} from './objects/seo'
import {person} from './person'
import {place} from './place'
import {product} from './product'

export const schemaTypes = [
  // dokumenty
  article,
  place,
  person,
  product,
  hotel,
  experience,
  category,
  author,
  // obiekty
  localizedString,
  localizedText,
  localizedSlug,
  mediaImage,
  pullQuote,
  seo,
]
