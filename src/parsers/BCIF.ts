import { ParserOptionsSpec } from "./ParserOptionsSpec";
import { base64ToArray, inflateString } from "../utilities";
import { MMTFobj } from "./MMTF"
//import { Matrix4 } from "../WebGL";
import { computeSecondaryStructure } from "./utils/computeSecondaryStructure";
import { processSymmetries } from "./utils/processSymmetries";
import { Category } from "./cifutils/category";
import { AtomSpec } from "specs";
import { assignPDBBonds } from "./utils/assignPDBBonds";
import { Matrix4 } from "../WebGL";
import { isEmpty } from "./utils/isEmpty";

declare var MMTF: MMTFobj;



/** 
 * @param bindata - binary UInt8Array buffer or a base64 encoded string
 * @param ParserOptionsSpec
 * @category Parsers
*/
export function BCIF(bindata: any, options: ParserOptionsSpec) {

  var noH = !options.keepH; // suppress hydrogens by default
  //var selAltLoc = options.altLoc ? options.altLoc : 'A'; //default alternate location to select if present
  var computeStruct = !options.noComputeSecondaryStructure;
  //var assemblyIndex = options.assemblyIndex ? options.assemblyIndex : 0;
  const noAssembly = !options.doAssembly; // don't assemble by default
  const assignbonds =
    options.assignBonds === undefined ? true : options.assignBonds;

  if (typeof (bindata) == "string") {
    //assume base64 encoded
    try {
      bindata = base64ToArray(bindata);
    } catch (error) {
      //not base64
      const encoder = new TextEncoder();
      bindata = encoder.encode(bindata);
    }
  } else {
    bindata = new Uint8Array(bindata);
  }

  var bcifData = MMTF.decodeMsgpack(bindata);
  if (bcifData == 31) {
    //was gziped
    bindata = inflateString(bindata, false);
    bcifData = MMTF.decodeMsgpack(bindata);
  }

  var atoms: any[][] & Record<string, any> = [];
  var modelData: any[] = atoms.modelData = [];


  var numModels = bcifData.dataBlocks.length;
  if (numModels == 0) return atoms;
  if (!options.multimodel) numModels = 1; //first only



  //loop over models, 
  for (let m = 0; m < numModels; m++) {

    const serialToIndex: number[] = []; // map from pdb serial to index in atoms
    modelData.push({ symmetries: [] });
    atoms.push([]);

    const block = bcifData.dataBlocks[m];
    const cats = Object.create(null);
    for (const cat of block.categories) {
      cats[cat.name.substr(1)] = Category(cat);
    }

    //extract secondary structure information

    //helices
    let sslookup = {}; //chain to residue range
    let sshelix = cats.struct_conf;
    if (sshelix) {
      let htypes = sshelix.getField('conf_type_id');
      let hchain = sshelix.getField('beg_label_asym_id');
      let hstart = sshelix.getField('beg_label_seq_id');
      let hend = sshelix.getField('end_label_seq_id');

      for (let i = 0; i < htypes.length; i++) {
        if (htypes[i].startsWith('H')) {
          let ch = hchain[i];
          let startResi = hstart[i];
          let endResi = hend[i];
          if (!(ch in sslookup)) {
            sslookup[ch] = {};
          }
          sslookup[ch][startResi] = "h1";
          for (let res = startResi + 1; res < endResi; res++) {
            sslookup[ch][res] = "h";
          }
          sslookup[ch][endResi] = "h2";
        }
      }
    }
    //sheets
    let sssheet = cats.struct_sheet_range;
    if (sssheet) {
      let sids = sssheet.getField('id');
      let schain = sssheet.getField('beg_label_asym_id');
      let sstart = sssheet.getField('beg_label_seq_id');
      let send = sssheet.getField('end_label_seq_id');

      for (let i = 0; i < sids.length; i++) {
        let ch = schain[i];
        let startResi = sstart[i];
        let endResi = send[i];
        if (!(ch in sslookup)) {
          sslookup[ch] = {};
        }
        sslookup[ch][startResi] = "s1";
        for (let res = startResi + 1; res < endResi; res++) {
          sslookup[ch][res] = "s";
        }
        sslookup[ch][endResi] = "s2";

      }
    }

    //symmetry operations
    let structops = cats.pdbx_struct_oper_list;
    let opids = structops.getField('id');
    if (opids && !noAssembly) {
      let matrix11 = structops.getField('matrix[1][1]');
      let matrix12 = structops.getField('matrix[1][2]');
      let matrix13 = structops.getField('matrix[1][3]');
      let matrix21 = structops.getField('matrix[2][1]');
      let matrix22 = structops.getField('matrix[2][2]');
      let matrix23 = structops.getField('matrix[2][3]');
      let matrix31 = structops.getField('matrix[3][1]');
      let matrix32 = structops.getField('matrix[3][2]');
      let matrix33 = structops.getField('matrix[3][3]');
      let vector1 = structops.getField('vector[1]');
      let vector2 = structops.getField('vector[2]');
      let vector3 = structops.getField('vector[3]');

      for (let i = 0; i < opids.length; i++) {
        const matrix = new Matrix4(
          matrix11[i],
          matrix12[i],
          matrix13[i],
          vector1[i],
          matrix21[i],
          matrix22[i],
          matrix23[i],
          vector2[i],
          matrix31[i],
          matrix32[i],
          matrix33[i],
          vector3[i]
        );
        modelData[modelData.length - 1].symmetries.push(matrix);
      }
    }
    //atom info

    let asites = cats.atom_site;
    let atomCount = asites.rowCount;
    let group_pdb = asites.getField('group_PDB')
    let cartn_x = asites.getField('Cartn_x');
    let cartn_y = asites.getField('Cartn_y');
    let cartn_z = asites.getField('Cartn_z');
    let auth_asym_id = asites.getField('auth_asym_id');
    let label_asym_id = asites.getField('label_asym_id');
    let auth_seq_id = asites.getField('auth_seq_id');
    let label_seq_id = asites.getField('label_seq_id');
    let auth_comp_id = asites.getField('auth_comp_id');
    let label_comp_id = asites.getField('label_comp_id');
    let auth_atom_id = asites.getField('auth_atom_id');
    let label_atom_id = asites.getField('label_atom_id');
    let type_symbol = asites.getField('type_symbol');
    let bfactors = asites.getField("B_iso_or_equiv");
    let serials = asites.getField('id');
    let icodes = asites.getField('label_alt_id');
    let modelnums = asites.getField('pdbx_PDB_model_num');
    let curmodel = modelnums ? modelnums[0] : 0;

    for (let i = 0; i < atomCount; i++) {
      if (group_pdb !== undefined &&
        group_pdb[i] === "TER"
      )
        continue;

      if (modelnums && modelnums[i] != curmodel) {
        curmodel = modelnums[i];
        if (options.multimodel) {
          if (!options.onemol) {
            atoms.push([]);
            modelData.push(modelData[modelData.length-1]);
          }
        } else {
          break; //first model only
        }
      }

      const atom: AtomSpec = {};
      atom.x = cartn_x[i];
      atom.y = cartn_y[i];
      atom.z = cartn_z[i];

      atom.chain = auth_asym_id
        ? auth_asym_id[i]
        : label_asym_id
          ? label_asym_id[i]
          : undefined;
      atom.lchain = label_asym_id
        ? label_asym_id[i]
        : undefined;
      atom.resi = auth_seq_id
        ? auth_seq_id[i]
        : label_seq_id
          ? label_seq_id[i]
          : undefined;
      atom.lresi = label_seq_id
        ? label_seq_id[i]
        : undefined;
      atom.resn = auth_comp_id
        ? auth_comp_id[i].trim()
        : label_comp_id
          ? label_comp_id[i].trim()
          : undefined;
      atom.atom = auth_atom_id
        ? auth_atom_id[i].replace(/"/gm, "")
        : label_atom_id
          ? label_atom_id[i].replace(/"/gm, "")
          : undefined; //"primed" names are in quotes

      atom.icode = icodes ? icodes[i] : undefined;
      atom.hetflag =
        !group_pdb ||
        group_pdb[i] === "HETA" ||
        group_pdb[i] === "HETATM";
      let elem = "X";
      if (type_symbol) {
        elem = type_symbol[i].replace(/\(?\+?\d+.*/, "");
      }

      atom.elem = elem[0].toUpperCase() + elem.substring(1, 2).toLowerCase();
      if (bfactors) atom.b = bfactors[i];

      if(noH && atom.elem == 'H') {
        continue;
      }

      atom.bonds = [];
      atom.ss = "c";
      atom.serial = serials[i];
      serialToIndex[atom.serial] = i;
      atom.bondOrder = [];
      atom.properties = {};
      atoms[atoms.length - 1].push(atom);
    }


    // Assign secondary structures from pdb file
    if (!isEmpty(sslookup)) {
      let matoms = atoms[atoms.length - 1];
      for (let i = 0; i < matoms.length; i++) {
        const atom = matoms[i];
        if (atom === undefined) continue;
        if (atom.lchain in sslookup && atom.lresi in sslookup[atom.lchain]) {
          const code = sslookup[atom.lchain][atom.lresi];
          atom.ss = code[0];
          if (code.length > 1) {
            if (code[1] == "1") atom.ssbegin = true;
            else if (code[1] == "2") atom.ssend = true;
          }
        }
      }
    }

    if (options.multimodel && m < numModels - 1) {
      if (!options.onemol) {
        atoms.push([]);
        modelData.push({ symmetries: [] });
      }
    }
  }

  for (let i = 0; i < atoms.length; i++) {
    if (
      assignbonds &&
      !(options.duplicateAssemblyAtoms && !options.dontConnectDuplicatedAtoms)
    ) {
      assignPDBBonds(atoms[i], options);
    }

    if (computeStruct) {
      computeSecondaryStructure(atoms[i], options.hbondCutoff);
    }

    processSymmetries(
      modelData[i].symmetries,
      atoms[i],
      options,
      modelData[i].cryst
    );
    if (
      options.duplicateAssemblyAtoms &&
      !options.dontConnectDuplicatedAtoms &&
      assignbonds
    )
      assignPDBBonds(atoms[i], options);
  }
  return atoms;

};