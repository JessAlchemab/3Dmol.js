import { LabelCount, Label } from './Label';
import { Parsers } from './parsers/index';
import { Gradient } from './Gradient';
import { ssColors, elementColors, residues, chains, builtinColorSchemes, getColorFromStyle, htmlColors } from "./colors";
import {
  Camera,
  CC,
  clamp,
  ClampToEdgeWrapping,
  Color,
  Colors,
  conversionMatrix3,
  Cylinder,
  degToRad,
  EventDispatcher,
  FloatType,
  Fog,
  Geometry,
  GeometryGroup,
  GeometryIDCount,
  ImposterMaterial,
  InstancedMaterial,
  intersectObject,
  Light,
  Line,
  LinearFilter,
  LinearMipMapLinearFilter,
  LineBasicMaterial,
  LineStyle,
  Material,
  MaterialIdCount,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshDoubleLambertMaterial,
  MeshLambertMaterial,
  MeshOutlineMaterial,
  NearestFilter,
  Object3D,
  Object3DIDCount,
  Projector,
  Quaternion,
  R32Format,
  Ray,
  Raycaster,
  Renderer,
  RFormat,
  RGBAFormat,
  Scene,
  ShaderLib,
  ShaderUtils,
  Shading,
  Sides,
  Sphere,
  SphereImposterMaterial,
  SphereImposterOutlineMaterial,
  Sprite,
  SpriteAlignment,
  SpriteMaterial,
  SpritePlugin,
  StickImposterMaterial,
  StickImposterOutlineMaterial,
  Texture,
  TextureIdCount,
  TextureOperations,
  Triangle,
  UnsignedByteType,
  UVMapping,
  Vector2,
  Vector3,
  VolumetricMaterial,
  square,
} from "./WebGL";
import { getAtomProperty } from './utils/getAtomProperty';
import { base64ToArray } from './utils/base64ToArray';
//@ts-ignore
window.$3Dmol = {
  //@ts-ignore
  ...(window.$3Dmol || {}),
  //@ts-ignore
  Matrix3,
  Matrix4,
  Quaternion,
  Ray,
  conversionMatrix3,
  Vector2,
  Vector3,
  Math: {
    clamp,
    degToRad,
  },
  square,
  Cylinder,
  Sphere,
  Triangle,
  SpritePlugin,
  ShaderLib,
  ShaderUtils,
  NoColors: Colors.NoColors,
  FaceColors: Colors.FaceColors,
  VertexColors: Colors.VertexColors,
  NoShading: Shading.NoShading,
  FlatShading: Shading.FlatShading,
  SmoothShading: Shading.SmoothShading,
  FrontSide: Sides.FrontSide,
  BackSide: Sides.BackSide,
  DoubleSide: Sides.DoubleSide,
  SpriteAlignment,
  ClampToEdgeWrapping,
  LinearFilter,
  NearestFilter,
  LinearMipMapLinearFilter,
  UnsignedByteType,
  FloatType,
  RGBAFormat,
  RFormat,
  R32Format,
  MultiplyOperation: TextureOperations.MultiplyOperation,
  AddOperation: TextureOperations.AddOperation,
  MixOperation: TextureOperations.MixOperation,
  Color,
  CC,
  EventDispatcher,
  GeometryIDCount,
  Geometry,
  GeometryGroup,
  intersectObject,
  Object3D,
  Object3DIDCount,
  Projector,
  Raycaster,
  Texture,
  TextureIdCount,
  UVMapping,
  ImposterMaterial,
  InstancedMaterial,
  LineBasicMaterial,
  Material,
  MaterialIdCount,
  MeshDoubleLambertMaterial,
  MeshLambertMaterial,
  MeshOutlineMaterial,
  SphereImposterMaterial,
  SphereImposterOutlineMaterial,
  SpriteMaterial,
  StickImposterMaterial,
  StickImposterOutlineMaterial,
  VolumetricMaterial,
  MeshBasicMaterial,
  Camera,
  Light,
  Scene,
  Line,
  Mesh,
  Sprite,
  LineStrip: LineStyle.LineStrip,
  LinePieces: LineStyle.LinePieces,
  Fog,
  Renderer,
  ssColors,
  elementColors,
  residues,
  chains,
  htmlColors,
  builtinColorSchemes,
  getColorFromStyle,
  Gradient,
  getAtomProperty,
  Parsers,
  base64ToArray,
  Label,
  LabelCount
};
